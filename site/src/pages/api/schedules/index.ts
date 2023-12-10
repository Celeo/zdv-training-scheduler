import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data.js";
import { RequiredPermission, checkAuth } from "../../../util/auth.js";
import { LOGGER } from "../../../util/log.js";
import { infoToName } from "../../../util/print.js";

/**
 * Get the user's schedules.
 *
 * Includes date exclusions in the future.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request, RequiredPermission.TRAINER);
  if (auth.kind === "invalid") {
    return auth.data;
  }
  const data = await DB.trainingSchedule.findMany({
    where: { trainer: auth.data.info.cid },
    include: { trainingScheduleExceptions: true },
  });

  const now = DateTime.utc();
  for (const schedule of data) {
    schedule.trainingScheduleExceptions = schedule.trainingScheduleExceptions
      .map((excl) => ({
        ...excl,
        dateTime: DateTime.fromISO(`${excl.date}T${schedule.timeOfDay}`, {
          zone: "utc",
        }),
      }))
      .filter(({ dateTime }) => dateTime >= now)
      .map((excl) => ({
        id: excl.id,
        scheduleId: excl.scheduleId,
        date:
          excl.dateTime.setZone(context.locals.timezone).toISODate() ?? "ERROR",
      }));
  }

  return new Response(JSON.stringify(data));
}

type CreatePayload = {
  dayOfWeek: number;
  timeOfDay: string;
};

/**
 * Create a new schedule. Trainers only.
 */
export async function POST(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request, RequiredPermission.TRAINER);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const body: CreatePayload = await context.request.json();

  /*
   * Process:
   * 1. Take the current date, in the user's timezone, with their specified time.
   * 2. Step forward day by day until the day of the week matches their selection.
   * 3. Convert the timestamp to UTC
   * 4. Save the day of week and time of day of the UTC timestamp
   */

  let dtUser = DateTime.fromISO(
    `${DateTime.utc().toISODate()}T${body.timeOfDay}:00`,
    { zone: context.locals.timezone },
  );
  while (dtUser.weekday !== body.dayOfWeek) {
    dtUser = dtUser.plus({ day: 1 });
  }
  const dtUserUtc = dtUser.toUTC();
  const newTime = dtUserUtc.toLocaleString(DateTime.TIME_24_SIMPLE);
  await DB.trainingSchedule.create({
    data: {
      trainer: auth.data.info.cid,
      dayOfWeek: dtUserUtc.weekday,
      timeOfDay: newTime,
    },
  });

  LOGGER.info(
    `${infoToName(auth.data.info)} created schedule: ${
      dtUserUtc.weekday
    }, ${newTime}`,
  );
  return new Response(null, { status: 201 });
}
