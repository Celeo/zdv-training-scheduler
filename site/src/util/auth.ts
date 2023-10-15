import axios from "axios";
import * as jose from "jose";
import { nanoid } from "nanoid";
import liboauth, { OAuth2 } from "oauth";
import { DB } from "../data.ts";
import { loadConfig, type Config } from "./config.ts";
import { ADMIN_ROLES, TRAINER_ROLES } from "./constants.ts";
import { LOGGER } from "./log.ts";

/**
 * Token data back from ZDV SSO.
 */
export type ZdvAccessData = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Information about a ZDV member. Stored in JWT.
 *
 * This is only a subset of what ZDV SSO returns.
 */
export type ZdvUserInfo = {
  cid: number;
  email: string;
  first_name: string;
  last_name: string;
  oi: string;
  roles: Array<string>;
};

/**
 * The payload in the JWT stored on user's browsers.
 */
export type JwtPayload = {
  access_token: string;
  info: ZdvUserInfo;
  iss: string;
  aud: string;
  iat: number;
};

/**
 * Result of checking the user's JWT.
 */
export type AuthStatus = {
  payload: JwtPayload | null;
  shortCircuit: Response | null;
};

const AUTHORIZATION_HEADER = "authorization";

/**
 * Permissions for an endpoint.
 */
export enum RequiredPermission {
  ALL,
  TRAINER,
  ADMIN,
}

const GATE_TO_ROLES = {
  [RequiredPermission.TRAINER]: TRAINER_ROLES,
  [RequiredPermission.ADMIN]: ADMIN_ROLES,
};

const JWT_SOURCE = "urn:zdv:training-scheduler";

/**
 * Check if the user has a trainer role.
 */
export function canBeTrainer(info: ZdvUserInfo): boolean {
  return TRAINER_ROLES.some((role) => info.roles.includes(role));
}

/**
 * Check whether the user is a Senior Staff member (or WM).
 */
export function isSiteAdmin(info: ZdvUserInfo): boolean {
  return ADMIN_ROLES.some((role) => info.roles.includes(role));
}

/**
 * Build the OAuth2 library object.
 */
function getOAuth(config: Config): OAuth2 {
  return new liboauth.OAuth2(
    config.oauth.clientId,
    config.oauth.clientSecret,
    config.oauth.baseUrl,
    config.oauth.authorizeEndpoint,
    config.oauth.tokenEndpoint,
  );
}

/**
 * Return the ZDV OAuth authorization URL using a random state,
 * and that state for verification.
 *
 * Called to start the login flow.
 */
export async function getAuthorizationUrl(): Promise<{
  url: string;
  state: string;
}> {
  const state = nanoid(64);
  const config = await loadConfig();
  const url = getOAuth(config).getAuthorizeUrl({
    redirect_uri: config.oauth.redirectUri,
    state,
    response_type: "code",
  });
  return { url, state };
}

/**
 * Exchange a code from ZDV OAuth for access and refresh tokens.
 *
 * Called as part 2 of the login flow.
 */
export async function getAccessToken(code: string): Promise<ZdvAccessData> {
  const config = await loadConfig();
  const oauth = getOAuth(config);
  return new Promise((resolve, reject) => {
    try {
      oauth.getOAuthAccessToken(
        code,
        {
          redirect_uri: config.oauth.redirectUri,
          grant_type: "authorization_code",
        },
        (_: unknown, accessToken, refreshToken) => {
          resolve({ accessToken, refreshToken });
        },
      );
    } catch (err) {
      LOGGER.warn(`Error getting OAuth token`, err);
      reject(err);
    }
  });
}

/**
 * Get the information for the user of the access token.
 *
 * Called as part 3 of the login flow.
 */
export async function getUserInfo(
  access_token: string,
): Promise<ZdvUserInfo | null> {
  // make the authenticated call back to ZDV SSO
  const { data } = await axios.get<any>(
    (await loadConfig()).oauth.userInfoUri,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  );

  // prevent logins if needed
  const block = await DB.userBlocklist.findFirst({
    where: { cid: data.user.cid },
  });
  if (block !== null) {
    LOGGER.info(
      `${data.user.firstname} ${data.user.lastname} (${data.user.oi.oi}, ${data.user.cid.cid}) has been prevented from logging in: ${block.reason}`,
    );
    return null;
  }

  // data to be put into the JWT; only part of the available data
  const userInfo = {
    cid: data.user.cid,
    email: data.user.email,
    first_name: data.user.firstname,
    last_name: data.user.lastname,
    oi: data.user.oi,
    roles: data.user.roles.map((role: { name: string }) => role.name),
  };

  // create `TeacherRating` if is trainer and no existing record
  if (canBeTrainer(userInfo)) {
    const teacherRating = await DB.teacherRating.findFirst({
      where: { cid: userInfo.cid },
    });
    if (teacherRating === null) {
      await DB.teacherRating.create({ data: { cid: userInfo.cid } });
    }
  }

  // create `UserPreference` if no existing record
  const userPrefs = await DB.userPreference.findFirst({
    where: { cid: userInfo.cid },
  });
  if (userPrefs === null) {
    await DB.userPreference.create({ data: { cid: userInfo.cid } });
  }

  // log it
  LOGGER.info(
    `${userInfo.first_name} ${userInfo.last_name} (${userInfo.oi}, ${userInfo.cid}) has logged in`,
  );

  return userInfo;
}

/**
 * Create a JWT for the user, based on their ZDV OAuth access token
 * and the information retrieved using that token from the ZDV SSO API.
 *
 * This JWT serves as the user's session information, to be stored in
 * their browser's `localStorage`.
 *
 * Called as part 4 of the login flow.
 */
export async function createJwt(
  access_token: string,
  info: ZdvUserInfo,
): Promise<string> {
  const secret = new TextEncoder().encode((await loadConfig()).jwtSecret);
  return await new jose.SignJWT({ access_token, info })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_SOURCE)
    .setAudience(JWT_SOURCE)
    .setIssuedAt()
    .sign(secret);
}

/**
 * Verify a JWT and return its payload.
 */
async function verifyJwt(jwt: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode((await loadConfig()).jwtSecret);
  const { payload } = await jose.jwtVerify(jwt, secret, {
    issuer: JWT_SOURCE,
    audience: JWT_SOURCE,
  });
  return payload as JwtPayload;
}

/**
 * Check the authorization header from the request, retrieving and
 * validating the JWT, and ensuring the user has the ability to
 * access logged-in-only parts of the site.
 *
 * If there is an error with the user's authentication, part of the
 * returned object will have a `Response` which should be returned
 * to the user directly.
 *
 * Called as part of endpoint authentication & authorization flow.
 */
export async function checkAuth(
  request: Request,
  gate: RequiredPermission = RequiredPermission.ALL,
): Promise<AuthStatus> {
  const authHeader = request.headers.get(AUTHORIZATION_HEADER);
  if (authHeader === null) {
    // user is not logged in
    return {
      payload: null,
      shortCircuit: new Response(`Missing "${AUTHORIZATION_HEADER}" header`, {
        status: 401,
      }),
    };
  }
  try {
    const auth = await verifyJwt(authHeader.substring(7));

    // per-page permissions gating
    if (gate !== RequiredPermission.ALL && !auth.info.roles.includes("wm")) {
      const sufficient = auth.info.roles.find((role) =>
        GATE_TO_ROLES[gate].includes(role),
      );
      if (!sufficient) {
        return {
          payload: null,
          shortCircuit: new Response("Missing roles", { status: 403 }),
        };
      }
    }

    /*
     * Since JWTs live on the user's browser, there needs to be some way to
     * prevent their access to the site if needed, like for dismissals,
     * abuse, or mandate of the ATM/DATM/TA.
     */
    const blocked = await DB.userBlocklist.findFirst({
      where: { cid: auth.info.cid },
    });
    if (blocked) {
      LOGGER.info(
        `${auth.info.first_name} ${auth.info.last_name} (${auth.info.oi}, ${auth.info.cid}) was blocked from accessing the site`,
      );
      return {
        payload: null,
        shortCircuit: new Response(
          "You have been blocked from accessing this site",
          { status: 401 },
        ),
      };
    }

    return {
      payload: auth,
      shortCircuit: null,
    };
  } catch (err) {
    // singing issue / tampered with / different secret / something weird
    LOGGER.warn(`Could not verify JWT from user: ${err}`);
    return {
      payload: null,
      shortCircuit: new Response("Could not verify JWT", { status: 400 }),
    };
  }
}

/**
 * Get a controller's information from their CID from ZDV.
 */
export async function getUserInfoFromCid(cid: number): Promise<ZdvUserInfo> {
  const config = await loadConfig();
  /*
   * Would be nice to get a specific user, rather than the whole roster,
   * but that endpoint throws errors. This endpoint only gets the active
   * roster, rather than all controllers who've been through ZDV, so
   * it's "fast enough".
   */
  const resp = await axios.get<Array<Record<string, unknown>>>(
    config.oauth.userRoster,
  );
  const controller = resp.data.find((c) => c.cid === cid);
  if (!controller) {
    throw new Error(`Could not find controller with CID ${cid}`);
  }
  return {
    cid: controller.cid as number,
    email: controller.email as string,
    first_name: controller.first_name as string,
    last_name: controller.last_name as string,
    oi: controller.operating_initials as string,
    roles: controller.roles as Array<string>,
  };
}
