import * as nodemailer from "nodemailer";
import { DB } from "../data.ts";
import { getUserInfoFromCid } from "./auth.ts";
import { loadConfig } from "./config.ts";
import { LOGGER } from "./log.ts";

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
  // construct message
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

  // based on the user's preferences, send them the message over Discord and/or email (or neither)
  let userPrefs = await DB.userPreference.findFirst({ where: { cid } });
  if (userPrefs?.receiveDiscordMessages) {
    try {
      await DB.discordMessage.create({ data: { cid, message } });
    } catch (err) {
      LOGGER.error(`Could not enqueue Discord notification for ${cid}`, err);
    }
  }
  if (userPrefs?.receiveEmails) {
    try {
      await sendEmail(cid, message);
    } catch (err) {
      LOGGER.error(`Could not send email notification for ${cid}`, err);
    }
  }
}

/**
 * Send an email via ZDV's email services.
 */
async function sendEmail(cid: number, text: string): Promise<void> {
  const config = await loadConfig();
  const userInfo = await getUserInfoFromCid(cid);

  // use the ZDV email servers, as the zdvartcc.org site does
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: true,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
    tls: {
      servername: config.email.servername,
    },
  });
  await transporter.sendMail({
    from: config.email.from,
    to: userInfo.email,
    subject: "ZDV Training Notification",
    text,
  });
  LOGGER.info(`Sent email to ${userInfo.email}`);
}
