import { writeFileSync } from "node:fs";
import { spawn } from "node:child_process";

const jwtSecret = process.env.JWT_SECRET;
const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;
const baseUrl = process.env.OAUTH_BASE_URL;
const authorizeEndpoint = process.env.OAUTH_AUTHORIZE_ENDPOINT;
const tokenEndpoint = process.env.OAUTH_TOKEN_ENDPOINT;
const redirectUri = process.env.OAUTH_REDIRECT_URI;
const userInfoUri = process.env.OAUTH_USER_INFO_URI;

const pairs = [
  ["JWT_SECRET", jwtSecret],
  ["OAUTH_CLIENT_ID", clientId],
  ["OAUTH_CLIENT_SECRET", clientSecret],
  ["OAUTH_BASE_URL", baseUrl],
  ["OAUTH_AUTHORIZE_ENDPOINT", authorizeEndpoint],
  ["OAUTH_TOKEN_ENDPOINT", tokenEndpoint],
  ["OAUTH_REDIRECT_URI", redirectUri],
  ["OAUTH_USER_INFO_URI", userInfoUri],
];
for (const [key, val] of pairs) {
  if (val === undefined) {
    console.error(`Missing env var: "${key}"`);
    process.exit(1);
  }
}

const toWrite = `
jwtSecret = "${jwtSecret}"

[oauth]
clientId = "${clientId}"
clientSecret = "${clientSecret}"
baseUrl = "${baseUrl}"
authorizeEndpoint = "${authorizeEndpoint}"
tokenEndpoint = "${tokenEndpoint}"
redirectUri = "${redirectUri}"
userInfoUri = "${userInfoUri}"
`;

writeFileSync(".config.toml", toWrite);
console.log("Config written from env vars");

const runtime = spawn("node", ["dist/server/entry.mjs"]);
runtime.stdout.on("data", (data) => console.log(`${data}`));
runtime.stderr.on("data", (data) => console.log(`${data}`));
