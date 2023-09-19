import axios from "axios";
import { nanoid } from "nanoid";
import liboauth from "oauth";

export type ZdvAccessData = {
  accessToken: string;
  refreshToken: string;
};

// this is a subset of the available information
export type ZdvUserInfo = {
  message: string;
  user: {
    cid: number;
    email: string;
    firstname: string;
    lastname: string;
    oi: string;
    roles: Array<{ name: string }>;
  };
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
        (_, accessToken, refreshToken) => {
          resolve({ accessToken, refreshToken });
        },
      );
    } catch (err) {
      console.error(`Error getting OAuth token: ${err}`);
      reject(err);
    }
  });
}

/**
 * Get the information for the user of the access token.
 */
export async function getUserInfo(access_token: string): Promise<ZdvUserInfo> {
  const { data } = await axios.get<ZdvUserInfo>(
    import.meta.env.ZDV_OAUTH_USER_INFO_URI,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );
  return data;
}

export function isLoggedIn(): boolean {
  return localStorage.getItem("sso-access-token") !== null;
}
