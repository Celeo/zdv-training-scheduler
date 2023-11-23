import { promises } from "fs";
import memoize from "memoizee";
import * as toml from "toml";
const { readFile } = promises;

/**
 * App configuration.
 */
export type Config = {
  /** ARTCC name to show in title and header */
  facilityShort: string;
  /** ARTCC site domain name */
  facilityDomain: string;
  /** Signing secret for JWTs */
  jwtSecret: string;
  /** Secret for Discord bot site access */
  discordSecret: string;
  /** VATUSA JWT */
  vatusaToken: string;
  /** Positions in the ARTCC */
  positions: Array<[string, string]>;
  /** ZDV SSO data */
  oauth: {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    authorizeEndpoint: string;
    tokenEndpoint: string;
    redirectUri: string;
    userInfoUri: string;
    userRoster: string;
  };
  /** ZDV email data */
  email: {
    host: string;
    servername: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
};

async function _loadConfig(): Promise<Config> {
  const text = await readFile(".config.toml", { encoding: "utf-8" });
  return toml.parse(text);
}

/**
 * Retrieve and return the app configuration from disk.
 *
 * This function is memoized.
 */
export const loadConfig = memoize(_loadConfig);
