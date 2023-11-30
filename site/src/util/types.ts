/*
 * Calendar lib
 */

import type {
  TrainingSchedule,
  TrainingScheduleException,
  TrainingSession,
} from "@prisma/client";
import type { DateTime } from "luxon";

export type Range<T> = [T, T];
export type ValuePiece = Date | null;
export type Value = ValuePiece | Range<ValuePiece>;
export type View = "century" | "decade" | "year" | "month";
export type TileArgs = {
  activeStartDate: Date;
  date: Date;
  view: View;
};

/*
 * DB models with luxon::DateTime instead of Date
 */

export type TrainingScheduleException_DT = Omit<
  TrainingScheduleException,
  "dateTime"
> & { dateTime: DateTime };

export type TrainingSession_DT = Omit<TrainingSession, "dateTime"> & {
  dateTime: DateTime;
};

/**
 * The `TrainingSchedule` model with the joined `TrainingScheduleException` field.
 */
export type TrainingScheduleWithExceptions = TrainingSchedule & {
  trainingScheduleExceptions: Array<TrainingScheduleException>;
};
