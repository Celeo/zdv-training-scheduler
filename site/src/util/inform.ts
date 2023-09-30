import { DB } from "../data/db";
import { loadConfig } from "./config";

/**
 * Triggering events that warrant async communication to the user.
 */
export enum InformTypes {
  JOINED_SITE,
  ACCEPTED_SESSION,
  STUDENT_CANCELLED_SESSION,
  TRAINER_CANCELLED_SESSION,
}

/**
 * Send communication to a user, based on their preferences.
 *
 * @param cid - message recipient
 * @param type - triggering event
 * @param data - extra data; dependent on the triggering event
 */
export async function informUser(
  cid: number,
  type: InformTypes,
  data: Record<string, any>,
): Promise<void> {
  let userPrefs = await DB.userPreference.findFirst({ where: { cid } });
  if (userPrefs === null) {
    userPrefs = await DB.userPreference.create({ data: { cid } });
  }
  let message = "";
  switch (type) {
    case InformTypes.JOINED_SITE: {
      message = "Welcome to the ZDV training site!";
      break;
    }
    case InformTypes.ACCEPTED_SESSION: {
      message = `${data.first_name} ${data.last_name} (${data.oi}) has accepted your training session on ${data.date} at ${data.time}`;
      break;
    }
    case InformTypes.STUDENT_CANCELLED_SESSION:
    case InformTypes.TRAINER_CANCELLED_SESSION: {
      message = `${data.first_name} ${data.last_name} (${data.oi}) has cancelled the training session on ${data.date} at ${data.time}`;
      break;
    }
  }
  if (userPrefs.receiveDiscordMessages) {
    await queueDiscordMessage(cid, message);
  }
  if (userPrefs.receiveEmails) {
    await sendEmail(cid, message);
  }
}

/**
 * Queue a message for the Discord bot to retrieve.
 */
async function queueDiscordMessage(
  cid: number,
  message: string,
): Promise<void> {
  await DB.log.create({
    data: { message: `Enqueuing Discord message: ${message}` },
  });
  await DB.discordMessage.create({ data: { cid, message } });
}

/**
 * Send an email via ZDV's email services.
 */
async function sendEmail(cid: number, message: string): Promise<void> {
  const config = await loadConfig();
  // TODO
}
