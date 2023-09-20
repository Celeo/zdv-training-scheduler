import axios from "axios";
import { nanoid } from "nanoid";
import liboauth from "oauth";
import * as jose from "jose";
import { isCidBlocked } from "../data/db";

export type ZdvAccessData = {
  accessToken: string;
  refreshToken: string;
};

// this is a subset of the available information
export type ZdvUserInfo = {
  cid: number;
  email: string;
  first_name: string;
  last_name: string;
  oi: string;
  roles: Array<{ name: string }>;
};

const ZDV_OAUTH = new liboauth.OAuth2(
  import.meta.env.ZDV_OAUTH_CLIENT_ID,
  import.meta.env.ZDV_OAUTH_CLIENT_SECRET,
  import.meta.env.ZDV_OAUTH_BASE_URL,
  import.meta.env.ZDV_OAUTH_AUTHORIZE_ENDPOINT,
  import.meta.env.ZDV_OAUTH_TOKEN_ENDPOINT,
);

/**
 * Return the ZDV OAuth authorization URL using a random state,
 * and that state for verification.
 */
export function getAuthorizationUrl(): { url: string; state: string } {
  const state = nanoid();
  const url = ZDV_OAUTH.getAuthorizeUrl({
    redirect_uri: import.meta.env.ZDV_OAUTH_REDIRECT_URI,
    scope: import.meta.env.ZDV_OAUTH_SCOPES,
    state,
    response_type: "code",
  });
  return { url, state };
}

/**
 * Exchange a code from ZDV OAuth for access and refresh tokens.
 */
export async function getAccessToken(code: string): Promise<ZdvAccessData> {
  return new Promise((resolve, reject) => {
    try {
      ZDV_OAUTH.getOAuthAccessToken(
        code,
        {
          redirect_uri: import.meta.env.ZDV_OAUTH_REDIRECT_URI,
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
  const { data } = await axios.get<any>(
    import.meta.env.ZDV_OAUTH_USER_INFO_URI,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  const block = await isCidBlocked(data.user.cid);
  if (block !== null) {
    console.log(
      `${data.user.firstname} ${data.user.lastname} (${data.user.oi.oi}, ${data.user.cid.cid}) has been prevented from logging in: ${block.reason}`,
    );
    return null;
  }

  return {
    cid: data.user.cid,
    email: data.user.email,
    first_name: data.user.firstname,
    last_name: data.user.lastname,
    oi: data.user.oi,
    roles: data.user.roles.map((role: Record<string, unknown>) => ({
      name: role.name,
    })),
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
  const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET);
  return await new jose.SignJWT({
    access_token,
    info,
    login_at: new Date().toLocaleString("en-US"),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("urn:zdv:training-scheduler")
    .setAudience("urn:zdv:training-scheduler")
    .setIssuedAt()
    .sign(secret);
}

/**
 * Verify a JWT and return its content.
 */
export async function verifyJwt(jwt: string): Promise<unknown> {
  const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(jwt, secret, {
    issuer: "urn:zdv:training-scheduler",
    audience: "urn:zdv:training-scheduler",
  });
  return payload;
}
