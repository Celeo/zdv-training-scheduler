import type { Config } from "./config";

/**
 * Triggering events that warrant async communication to the user.
 */
export enum InformTypes {
  ACCEPTED_SESSION,
  STUDENT_CANCELLED_SESSION,
  TRAINER_CANCELLED_SESSION,
}

/**
 * Send communication to a user, based on their preferences.
 */
export async function informUser(): Promise<void> {
  //
}

/**
 * Queue a message for the Discord bot to retrieve.
 */
async function queueDiscordMessage(config: Config): Promise<void> {
  //
}

/**
 * Send an email via ZDV's email services.
 */
async function sendEmail(config: Config): Promise<void> {
  // TODO
}
