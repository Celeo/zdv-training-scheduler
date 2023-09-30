import * as toml from "toml";
import memoize from "memoizee";
import { promises } from "fs";
const { readFile } = promises;

/**
 * App configuration.
 */
export type Config = {
  /** Signing secret for JWTs */
  jwtSecret: string;
  /** ZDV SSO data */
  oauth: {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    authorizeEndpoint: string;
    tokenEndpoint: string;
    redirectUri: string;
    userInfoUri: string;
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

/**
 * Valid session statuses.
 */
export enum SESSION_STATUS {
  OPEN = "open",
  ACCEPTED = "accepted",
  COMPLETE = "complete",
  CANCELLED = "cancelled",
}
