import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data.js";
import { RequiredPermission, checkAuth } from "../../../util/auth.js";
import { LOGGER } from "../../../util/log.js";
import { infoToName } from "../../../util/print.js";

/*
 * TODO timezone support
 */

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

  // filter exclusions to those in the future
  const now = DateTime.utc();
  for (const schedule of data) {
    schedule.trainingScheduleExceptions =
      schedule.trainingScheduleExceptions.filter(
        (excl) =>
          DateTime.fromISO(`${excl.date}T${schedule.timeOfDay}`, {
            zone: "utc",
          }) >= now,
      );
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
  await DB.trainingSchedule.create({
    data: {
      trainer: auth.data.info.cid,
      dayOfWeek: body.dayOfWeek,
      timeOfDay: body.timeOfDay,
    },
  });
  LOGGER.info(
    `${infoToName(auth.data.info)} created schedule: ${body.dayOfWeek}, ${
      body.timeOfDay
    }`,
  );
  return new Response(null, { status: 201 });
}
