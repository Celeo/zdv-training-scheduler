import axios from "axios";
import type { DateTime } from "luxon";
import * as nodemailer from "nodemailer";
import { DB } from "../data.ts";
import { loadConfig } from "./config.ts";
import { LOGGER } from "./log.ts";
import { DateDisplayTypes, dateToStr, type PrintableName } from "./print.ts";

/**
 * Triggering events that warrant async communication to the user.
 */
export enum InformTypes {
  ACCEPTED_SESSION,
  ACCEPTING_SESSION,
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
  data: PrintableName & { dateTime: DateTime },
): Promise<void> {
  // construct message
  let message = "";
  switch (type) {
    case InformTypes.ACCEPTED_SESSION: {
      message = `${data.first_name} ${data.last_name} (${
        data.operating_initials
      }) has accepted your training session on ${dateToStr(
        data.dateTime,
        DateDisplayTypes.DateAndTime,
      )} UTC`;
      break;
    }
    case InformTypes.ACCEPTING_SESSION: {
      message = `You have accepted the session from ${data.first_name} ${
        data.last_name
      } (${data.operating_initials}) on ${dateToStr(
        data.dateTime,
        DateDisplayTypes.DateAndTime,
      )} UTC`;
      break;
    }
    case InformTypes.STUDENT_CANCELLED_SESSION:
    case InformTypes.TRAINER_CANCELLED_SESSION: {
      message = `${data.first_name} ${data.last_name} (${
        data.operating_initials
      }) has cancelled the training session on ${dateToStr(
        data.dateTime,
        DateDisplayTypes.DateAndTime,
      )} UTC`;
      break;
    }
  }

  // based on the user's preferences, send them the message over Discord and/or email (or neither)
  let userPrefs = await DB.userPreference.findFirst({ where: { cid } });
  if (userPrefs === null || userPrefs?.receiveDiscordMessages) {
    // default to Discord if there are no saved preferences for whatever reason
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
 * Use the VATUSA v2 API to get the user's email.
 */
async function getEmailForCid(cid: number): Promise<string> {
  const config = await loadConfig();
  const resp = await axios.get<{ data: { email: string } }>(
    `https://api.vatusa.net/user/${cid}?apikey=${config.vatusaToken}`,
  );
  if (resp.status !== 200) {
    throw new Error(`Got status ${resp.status} from VATUSA user details`);
  }
  const email = resp.data.data.email;
  if (!email) {
    throw new Error(`No email returned from VATUSA details`);
  }
  return email;
}

/**
 * Send an email via ZDV's email services.
 */
export async function sendEmail(cid: number, text: string): Promise<void> {
  const config = await loadConfig();
  const email = await getEmailForCid(cid);

  // use the ZDV email servers, as the zdvartcc.org site does
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    requireTLS: true,
    secure: false,
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
    to: email,
    subject: `${config.facilityShort} Training Notification`,
    text,
  });
  LOGGER.info(`Sent email to ${email}`);
}
