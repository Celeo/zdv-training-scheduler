/**
 * Valid session statuses.
 */
export enum SESSION_STATUS {
  OPEN = "open",
  ACCEPTED = "accepted",
}

export const TRAINER_ROLES = ["mtr", "ins"];
export const ADMIN_ROLES = ["atm", "datm", "ta"];

/**
 * The number of pending sessions any one student can have before
 * being prevented from accepting more.
 */
export const MAXIMUM_PENDING_SESSIONS = 2;

/**
 * Number of weeks that students are able to look forward
 * to create sessions from a trainer's schedule.
 */
export const SCHEDULE_WEEK_OUTLOOK = 6;
