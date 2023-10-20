import axios, { all } from "axios";
import * as jose from "jose";
import { nanoid } from "nanoid";
import liboauth, { OAuth2 } from "oauth";
import { DB } from "../data.ts";
import { loadConfig, type Config } from "./config.ts";
import { ADMIN_ROLES, TRAINER_ROLES } from "./constants.ts";
import { LOGGER } from "./log.ts";
import { infoToName } from "./print.ts";

/**
 * Token data back from ZDV SSO.
 */
type ZdvAccessData = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Information about a ZDV member. Stored in JWT.
 *
 * This is only a subset of what ZDV SSO returns.
 */
type ZdvUserInfo = {
  cid: number;
  email: string;
  first_name: string;
  last_name: string;
  operating_initials: string;
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

type OAuthInfoUri = {
  user: {
    cid: number;
    email: string;
    firstname: string;
    lastname: string;
    controllerType: string;
    oi: string;
    roles: Array<{ name: string }>;
  };
};

/**
 * Permission-gating endpoints.
 */
export enum RequiredPermissions {
  /** Any user */
  ALL,
  /** Any logged-in user */
  SOME,
  /** Trainers */
  TRAINER,
  /** Admins */
  ADMIN,
}

const JWT_SOURCE = "urn:zdv:training-scheduler";

/**
 * Check if the user has a trainer role.
 */
export function isSiteTrainer(info: ZdvUserInfo): boolean {
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
  const { data } = await axios.get<OAuthInfoUri>(
    (await loadConfig()).oauth.userInfoUri,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  // data to be put into the JWT; only part of the available data
  const userInfo = {
    cid: data.user.cid,
    email: data.user.email,
    first_name: data.user.firstname,
    last_name: data.user.lastname,
    operating_initials: data.user.oi,
    roles: data.user.roles.map((role) => role.name),
  };

  // only home and visiting controllers can train
  if (data.user.controllerType === "none") {
    LOGGER.info(
      `Non-member controller attempted to log in: ${infoToName(userInfo)} (${
        data.user.cid
      })`,
    );
    return null;
  }

  // prevent logins if needed
  const block = await DB.userBlocklist.findFirst({
    where: { cid: data.user.cid },
  });
  if (block !== null) {
    LOGGER.info(
      `${infoToName(userInfo)} (${
        data.user.cid
      }) has been prevented from logging in: ${block.reason}`,
    );
    return null;
  }

  // create `TeacherRating` if is trainer and no existing record
  if (isSiteTrainer(userInfo)) {
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
    // preference defaults are set in the table schema; just need CID to create
    await DB.userPreference.create({ data: { cid: userInfo.cid } });
  }

  // log it
  LOGGER.info(`${infoToName(userInfo)} (${userInfo.cid}) has logged in`);

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
export async function verifyJwt(jwt: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode((await loadConfig()).jwtSecret);
  const { payload } = await jose.jwtVerify(jwt, secret, {
    issuer: JWT_SOURCE,
    audience: JWT_SOURCE,
  });
  return payload as JwtPayload;
}

/**
 * Get a controller's information from their CID from ZDV.
 */
async function getUserInfoFromCid(cid: number): Promise<ZdvUserInfo> {
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

  // don't need everything; just what's useful for this site
  return {
    cid: controller.cid as number,
    email: controller.email as string,
    first_name: controller.first_name as string,
    last_name: controller.last_name as string,
    operating_initials: controller.operating_initials as string,
    roles: controller.roles as Array<string>,
  };
}

/**
 * Check the auth header for the Discord bot's token.
 *
 * This is different from the authentication on the rest
 * of the site, since I don't want to bother with the bot
 * having to get a dynamic token from somewhere.
 *
 * Return an error `Response` if the header isn't present
 * or the value is incorrect.
 */
export async function checkDiscordHeader(
  request: Request,
): Promise<Response | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader === null) {
    return new Response(null, { status: 401 });
  }
  const config = await loadConfig();
  if (`Bearer ${config.discordSecret}` !== authHeader) {
    return new Response(null, { status: 403 });
  }
  return null;
}

/**
 * Check the user's JWT against an endpoint's required permissions.
 *
 * I could simply default the permissions argument to `ALL`, but
 * I'd rather be explicit about the permissions requirements of
 * individual endpoints via the call to this function.
 */
export function authResponse(
  info: ZdvUserInfo | null,
  perms: RequiredPermissions,
): Response | null {
  if (perms === RequiredPermissions.ALL) {
    return null;
  }
  if (info === null) {
    return new Response("You must log in to view this data", {
      status: 401,
    });
  }
  if (perms === RequiredPermissions.TRAINER) {
    if (!isSiteTrainer(info) && !isSiteAdmin(info)) {
      return new Response("You do not have permissions to view this data", {
        status: 403,
      });
    }
  } else if (!isSiteAdmin(info)) {
    return new Response("You do not have permissions to view this data", {
      status: 403,
    });
  }
  return null;
}
