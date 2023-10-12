import { Client, Events } from "discord.js";
import { Cron } from "croner";

const SITE_URL_ENV_VAR = "SITE_URL";
const SITE_TOKEN_ENV_VAR = "SITE_TOKEN";
const BOT_TOKEN_ENV_VAR = "DISCORD_BOT_TOKEN";

/**
 * Data from the site GET request.
 */
type SiteResponse = Array<{
  id: number;
  cid: number;
  message: string;
}>;

/**
 * Discord.js client
 */
const client = new Client({ intents: [] });

/**
 * Start and wait on the bot.
 */
async function main(): Promise<void> {
  client.on(Events.ClientReady, () => {
    console.log("Bot connected");
  });

  await client.login(process.env[BOT_TOKEN_ENV_VAR]);
}

/**
 * Wait for the specified milliseconds, as a `Promise`.
 */
function sleep(milliseconds: number): Promise<() => Promise<void>> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Query the ZDV roster to get the user's Discord user ID.
 */
async function getDiscordUserIdFromCid(
  cid: number
): Promise<string | undefined> {
  const resp = await fetch("https://api.zdvartcc.org/v1/user/all");
  const data: Array<{ cid: number; discord_id: string }> = await resp.json();
  return data.find((entry) => entry.cid === cid)?.discord_id;
}

/**
 * Check the site for messages, processing any that might be stored.
 */
async function checkForMessages(): Promise<void> {
  console.log("Checking for messages");
  const siteUrl = process.env[SITE_URL_ENV_VAR];
  try {
    let resp = await fetch(`${siteUrl}api/messages`, {
      headers: { authorization: `Bearer ${process.env[SITE_TOKEN_ENV_VAR]}` },
    });
    if (resp.status !== 200) {
      console.error(
        `Got status ${resp.status} from training site GET messages`
      );
      return;
    }
    const data: SiteResponse = await resp.json();
    for (const message of data) {
      const discordUser = await getDiscordUserIdFromCid(message.cid);
      if (discordUser === undefined) {
        console.error(
          `Could not send Discord message to cid ${message.id} - could not find Discord user id`
        );
        continue;
      }
      await client.users.send(discordUser, message.message);
      resp = await fetch(`${siteUrl}api/messages?id=${message.id}`, {
        method: "PUT",
        headers: { authorization: `Bearer ${process.env[SITE_TOKEN_ENV_VAR]}` },
      });
      if (resp.status !== 200) {
        console.error(
          `Got status ${resp.status} from training site trying to PUT #${message.id}`
        );
        continue;
      }
      console.log(`Sent message for #${message.id}`);
    }
  } catch (err) {
    console.error(`An error occurred: ${err}`);
  }
}

// check pending messages and deliver
Cron("* * * * *", async () => {
  await checkForMessages();
});

// session reminders, 1 hour before
Cron("0 * * * *", async () => {
  // TODO
});

/*
 * Entrypoint.
 */
if (import.meta.main) {
  for (const key of [SITE_URL_ENV_VAR, SITE_TOKEN_ENV_VAR, BOT_TOKEN_ENV_VAR]) {
    if (!process.env[key]) {
      console.error(`Missing "${key}" env var`);
      process.exit(1);
    }
  }
  await main();
}
