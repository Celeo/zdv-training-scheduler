/**
 * Valid session statuses.
 */
export enum SESSION_STATUS {
  OPEN = "open",
  ACCEPTED = "accepted",
  COMPLETE = "complete",
  CANCELLED = "cancelled",
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
