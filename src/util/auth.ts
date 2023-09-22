import axios from "axios";
import { nanoid } from "nanoid";
import liboauth, { OAuth2 } from "oauth";
import * as jose from "jose";
import { DB } from "../data/db";
import { loadConfig, type Config } from "./config";

/**
 * Token data back from ZDV SSO.
 */
export type ZdvAccessData = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Information about a ZDV member.
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

const AUTHORIZATION_HEADER = "authorization";

enum RequiredPermission {
  All,
  Trainer,
  Admin,
}

const TRAINER_ROLES = ["mtr", "ins", "atm", "datm", "ta"];
const ADMIN_ROLES = ["atm", "datm", "ta", "wm"];

const GATE_TO_ROLES = {
  [RequiredPermission.Trainer]: TRAINER_ROLES,
  [RequiredPermission.Admin]: ADMIN_ROLES,
};

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
 */
export async function getAuthorizationUrl(): Promise<{
  url: string;
  state: string;
}> {
  const state = nanoid();
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
      console.log(`Error getting OAuth token: ${err}`);
      reject(err);
    }
  });
}

/**
 * Get the information for the user of the access token.
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
    console.log(
      `${data.user.firstname} ${data.user.lastname} (${data.user.oi.oi}, ${data.user.cid.cid}) has been prevented from logging in: ${block.reason}`,
    );
    return null;
  }

  // payload to be put into the JWT; only part of the available data
  return {
    cid: data.user.cid,
    email: data.user.email,
    first_name: data.user.firstname,
    last_name: data.user.lastname,
    oi: data.user.oi,
    roles: data.user.roles.map((role: { name: string }) => role.name),
  };
}

/**
 * Create a JWT for the user, based on their ZDV OAuth access token
 * and the information retrieved using that token from the ZDV SSO API.
 *
 * This JWT serves as the user's session information, to be stored in
 * their browser's `localStorage`.
 */
export async function createJwt(
  access_token: string,
  info: ZdvUserInfo,
): Promise<string> {
  const secret = new TextEncoder().encode((await loadConfig()).jwtSecret);
  return await new jose.SignJWT({ access_token, info })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("urn:zdv:training-scheduler")
    .setAudience("urn:zdv:training-scheduler")
    .setIssuedAt()
    .sign(secret);
}

/**
 * Verify a JWT and return its payload.
 */
async function verifyJwt(jwt: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode((await loadConfig()).jwtSecret);
  const { payload } = await jose.jwtVerify(jwt, secret, {
    issuer: "urn:zdv:training-scheduler",
    audience: "urn:zdv:training-scheduler",
  });
  return payload as JwtPayload;
}

/**
 * Check the authorization header from the request, retrieving and
 * validating the JWT, and ensuring the user has the ability to
 * access logged-in-only parts of the site.
 *
 * If there is an error with the user's authentication, a `Response`
 * will be returned from this function, which should be returned
 * to the user directly.
 */
export async function checkAuth(
  request: Request,
  gate: RequiredPermission = RequiredPermission.All,
): Promise<Response | null> {
  const authHeader = request.headers.get(AUTHORIZATION_HEADER);
  if (authHeader === null) {
    return new Response(`Missing "${AUTHORIZATION_HEADER}" header`, {
      status: 401,
    });
  }
  try {
    const auth = await verifyJwt(authHeader);

    if (gate !== RequiredPermission.All) {
      const sufficient = auth.info.roles.find((role) =>
        GATE_TO_ROLES[gate].includes(role),
      );
      if (!sufficient) {
        return new Response("Missing roles", { status: 403 });
      }
    }

    /*
     * Since JWTs live on the user's browser, there needs to be some way to
     * prevent their access of the site if needed, like for dismissals,
     * abuse, or mandate of the ATM/DATM/TA.
     */
    const blocked = await DB.userBlocklist.findFirst({
      where: { cid: auth.info.cid },
    });
    if (blocked) {
      return new Response("You have been blocked from accessing this site", {
        status: 403,
      });
    }
  } catch {
    return new Response("Could not verify JWT", { status: 400 });
  }
  return null;
}
