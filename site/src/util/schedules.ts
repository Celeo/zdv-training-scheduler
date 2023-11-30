import type { TrainingSchedule } from "@prisma/client";
import { DateTime } from "luxon";
import { DB } from "../data";
import { SCHEDULE_WEEK_OUTLOOK } from "./constants";

/**
 * Given a user-local `DateTime`, find all schedules that are available then.
 *
 * This function first finds all sessions that are on the given day,
 * uses that to mark-off schedules from a list of all schedules, then
 * finds which schedules would "tick" on this day, rejects those that
 * have exclusions from the trainer, and rejects anything that'd be
 * in the past. These schedules are returned.
 */
export async function schedulesOnDate(
  date: DateTime,
  _DB = DB,
): Promise<Array<TrainingSchedule>> {
  const dayStart = date.startOf("day").toUTC();
  const dayEnd = date.endOf("day").toUTC();

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
  console.log("1 - ", schedules);

  schedules = schedules.filter(
    // filter out those that have a session on this date already
    (schedule) =>
      sessionsOnDate.find((session) => session.scheduleId === schedule.id) ===
      undefined,
  );
  console.log("2 - ", schedules);

  schedules = schedules.filter((s) => {
    // filter to schedules that would tick on the date
    let d = DateTime.fromISO(
      `${DateTime.utc().minus({ day: 1 }).toISODate()}T${s.timeOfDay}`,
      { zone: "utc" },
    );
    while (d.weekday !== s.dayOfWeek) {
      d = d.plus({ day: 1 });
    }
    console.log(d.toString());
    // only allow taking sessions out to a certain number of weeks
    for (let week = 0; week < SCHEDULE_WEEK_OUTLOOK; week++) {
      const d2 = d.plus({ week });
      if (dayStart <= d2 && d2 <= dayEnd) {
        return true;
      }
    }
    return false;
  });
  console.log("3 - ", schedules);

  schedules = schedules.filter(
    // filter out exclusions
    (schedule) =>
      !schedule.trainingScheduleExceptions.some(
        (except) => except.date === date.toISODate(),
      ),
  );
  console.log("4 - ", schedules);

  schedules = schedules.filter(
    // filter out stuff that'd be in the past
    (schedule) =>
      DateTime.fromISO(`${date.toISODate()}T${schedule.timeOfDay}`, {
        zone: "utc",
      }) > DateTime.utc(),
  );
  console.log("5 - ", schedules);
  return schedules;
}
