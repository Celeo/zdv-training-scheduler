/**
 * Valid session statuses.
 */
export enum SESSION_STATUS {
  OPEN = "open",
  ACCEPTED = "accepted",
}

/**
 * Available training positions.
 */
export type Positions =
  | "minorGround"
  | "majorGround"
  | "minorTower"
  | "majorTower"
  | "minorApproach"
  | "majorApproach"
  | "center";

/**
 * Mapping position names to friendly names.
 */
export const FRIENDLY_POSITION_NAME_MAP: Record<Positions, string> = {
  minorGround: "Minor Ground",
  majorGround: "Major Ground",
  minorTower: "Minor Tower",
  majorTower: "Major Tower",
  minorApproach: "Minor Approach",
  majorApproach: "Major Approach",
  center: "Center",
};

export const TRAINER_ROLES = ["mtr", "ins"];
export const ADMIN_ROLES = ["atm", "datm", "ta"];

/**
 * The number of pending sessions any one student can have before
 * being prevented from accepting more.
 */
export const MAXIMUM_PENDING_SESSIONS = 2;
