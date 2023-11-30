import type { TrainingSchedule, TrainingSession } from "@prisma/client";
import { DateTime } from "luxon";
import { DB } from "../data";
import { SCHEDULE_WEEK_OUTLOOK, SESSION_STATUS } from "./constants";
import type { TrainingScheduleWithExceptions } from "./types";

export type GeneratedSchedules = {
  schedules: Array<TrainingSchedule>;
  sessions: Array<TrainingSession>;
};

/**
 * Given a user-local `DateTime`, find all schedules that are available then.
 *
 * This function first finds all sessions that are on the given day,
 * uses that to mark-off schedules from a list of all schedules, then
 * finds which schedules would "tick" on this day, rejects those that
 * have exclusions from the trainer, and rejects anything that'd be
 * in the past. Unpersisted sessions are created from these matching
 * sessions. Both the schedules and sessions are returned.
 */
export async function schedulesOnDate(
  date: DateTime,
  _DB = DB,
): Promise<GeneratedSchedules> {
  const dayStart = date.startOf("day").toUTC();
  const dayEnd = date.endOf("day").toUTC();
  const nowUtc = DateTime.utc();

  const sessionsOnDate = await _DB.trainingSession.findMany({
    where: {
      dateTime: {
        lte: dayEnd.toJSDate(),
        gte: dayStart.toJSDate(),
      },
    },
  });

  let schedules = await _DB.trainingSchedule.findMany({
    include: { trainingScheduleExceptions: true },
  });

  // filter out those that have a session on this date already
  schedules = schedules.filter(
    (schedule) =>
      sessionsOnDate.find((session) => session.scheduleId === schedule.id) ===
      undefined,
  );

  // filter to schedules that would tick on the date
  let scheduleDatePairs: Array<[TrainingScheduleWithExceptions, DateTime]> =
    schedules
      .map((s) => {
        let d = DateTime.fromISO(
          `${DateTime.utc().minus({ day: 1 }).toISODate()}T${s.timeOfDay}`,
          { zone: "utc" },
        );
        while (d.weekday !== s.dayOfWeek) {
          d = d.plus({ day: 1 });
        }
        // only allow taking sessions out to a certain number of weeks
        for (let week = 0; week < SCHEDULE_WEEK_OUTLOOK; week++) {
          const d2 = d.plus({ week });
          if (dayStart <= d2 && d2 <= dayEnd) {
            return [s, d2];
          }
        }
        return [s, null];
      })
      .filter(([_sch, dateOrNull]) => dateOrNull !== null)
      .map((pair) => pair as [TrainingScheduleWithExceptions, DateTime]);

  // filter out exclusions
  scheduleDatePairs = scheduleDatePairs.filter(
    ([schedule, _]) =>
      !schedule.trainingScheduleExceptions.some(
        (except) => except.date === date.toISODate(),
      ),
  );

  // filter out stuff that'd be in the past
  scheduleDatePairs = scheduleDatePairs.filter(
    ([schedule, _]) =>
      DateTime.fromISO(`${date.toISODate()}T${schedule.timeOfDay}`, {
        zone: "utc",
      }) > DateTime.utc(),
  );

  const sessions = scheduleDatePairs.map(([schedule, matchedDate]) => ({
    id: -1,
    scheduleId: schedule.id,
    trainer: schedule.trainer,
    student: null,
    position: null,
    dateTime: matchedDate.toJSDate(),
    status: SESSION_STATUS.OPEN,
    notes: "",
    createdAt: nowUtc.toJSDate(),
    updatedAt: nowUtc.toJSDate(),
  }));

  return { schedules: scheduleDatePairs.map(([sch, _]) => sch), sessions };
}
