import { Client, Events } from "discord.js";
import { Cron } from "croner";
import { DateTime } from "luxon";

const SITE_URL_ENV_VAR = "SITE_URL";
const SITE_TOKEN_ENV_VAR = "SITE_TOKEN";
const BOT_TOKEN_ENV_VAR = "DISCORD_BOT_TOKEN";

/**
 * Data from the site messages request.
 */
type MessagesResponse = Array<{
  id: number;
  cid: number;
  message: string;
}>;

/**
 * Data from the site pending request.
 */
type PendingSessionsResponse = Array<{
  student?: number;
  date: string;
  time: string;
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
    const data: MessagesResponse = await resp.json();
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
    console.error(`Error getting messages: ${err}`);
  }
}

// check pending messages and deliver, every minute
Cron("* * * * *", async () => {
  await checkForMessages();
});

/**
 * Pull upcoming sessions from the site and send reminders
 * if they start in the next hour (and the user has Discord
 * notifications enabled).
 */
async function checkForReminders(): Promise<void> {
  try {
    const siteUrl = process.env[SITE_URL_ENV_VAR];
    let resp = await fetch(`${siteUrl}api/sessions/mine?pending=true`);
    const pendingSessions: PendingSessionsResponse = await resp.json();
    const now = DateTime.utc();
    for (const session of pendingSessions) {
      const recordDate = DateTime.fromISO(`${session.date}T${session.time}`, {
        zone: "utc",
      });
      if (now < recordDate) {
        const delta = now.toMillis() - recordDate.toMillis();
        if (delta > 0 && delta <= 1_000 * 60 * 60) {
          const discordUser = await getDiscordUserIdFromCid(session.student!);
          if (discordUser === undefined) {
            console.error(
              `Could not send Discord message to cid ${session.student} - could not find Discord user id`
            );
            continue;
          }
          await client.users.send(
            discordUser,
            `Your training session starts in 1 hour.`
          );
        }
      }
    }
  } catch (err) {
    console.error(`Error getting upcoming sessions: ${err}`);
  }
}

// session reminders, every hour
Cron("0 * * * *", async () => {
  await checkForReminders();
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
