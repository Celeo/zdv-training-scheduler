import type { TrainingSession } from "@prisma/client";
import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data.ts";
import {
  RequiredPermission,
  canBeTrainer,
  checkAuth,
} from "../../../util/auth.ts";
import { SESSION_STATUS } from "../../../util/constants.ts";
import { LOGGER } from "../../../util/log.ts";
import {
  DateDisplayTypes,
  dateToStr,
  infoToName,
} from "../../../util/print.ts";

/*
 * TODO timezone support
 */

/**
 * Get all sessions. 'date' is a require query param.
 *
 * Can optionally include a 'limit-to-open' query param
 * to filter the retrieved rows to just those that have
 * the 'open' status.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  // 'date' URL parameter is required
  const urlParams = new URL(context.request.url).searchParams;
  const dateStr = urlParams.get("date");
  if (!dateStr) {
    return new Response('Missing "date"', { status: 400 });
  }
  const date = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: "utc" });

  // find the sessions on the date and the schedules on the day of the week
  let sessions = await DB.trainingSession.findMany({
    where: {
      dateTime: { lte: date.endOf("day").toJSDate(), gte: date.toJSDate() },
    },
  });
  const schedules = await DB.trainingSchedule.findMany({
    where: { dayOfWeek: date.weekday },
    include: { trainingScheduleExceptions: true },
  });

  // for those schedules, filter down to those that don't have a session on this date
  const schedulesWithoutSessions = schedules.filter(
    (schedule) =>
      sessions.find((session) => session.scheduleId === schedule.id) ===
      undefined,
  );

  // for schedules that should "tick" on this date, filter to those that
  // the owner hasn't expressly cancelled (deleted), and add those to
  // the list of sessions to show to the user (with a mock id of -1)
  schedulesWithoutSessions
    .filter(
      (schedule) =>
        !schedule.trainingScheduleExceptions.some(
          (except) => except.date === dateStr,
        ),
    )
    .map((schedule) => ({
      id: -1,
      scheduleId: schedule.id,
      trainer: schedule.trainer,
      student: null,
      position: null,
      dateTime: DateTime.fromISO(`${dateStr}T${schedule.timeOfDay}`, {
        zone: "utc",
      }).toJSDate(),
      status: SESSION_STATUS.OPEN,
      notes: "",
      createdAt: date.toJSDate(),
      updatedAt: date.toJSDate(),
    }))
    .forEach((s) => sessions.push(s));

  let ret: Array<TrainingSession> = [];

  if (canBeTrainer(auth.data.info)) {
    // For trainers, their response includes all open sessions (as even trainers need
    // training sometimes), but also include their sessions on the date in case they
    // need to cancel them.
    sessions
      .filter(
        (session) =>
          session.status === SESSION_STATUS.OPEN ||
          session.trainer === auth.data.info.cid,
      )
      .forEach((session) => ret.push(session));
  } else {
    // Now filter to sessions that are open. This cannot have been done as part of the DB
    // query, since we needed to know _all_ the sessions on the date to determine
    // which schedules should "tick".
    sessions
      .filter((session) => session.status === SESSION_STATUS.OPEN)
      .forEach((session) => ret.push(session));
  }

  // sort by time of day for better UX
  ret.sort(
    (a, b) =>
      DateTime.fromJSDate(a.dateTime).hour -
      DateTime.fromJSDate(b.dateTime).hour,
  );

  return new Response(JSON.stringify(ret));
}

type UpdatePayload = {
  date: string;
  time: string;
  notes: string;
};

/**
 * Create a new session. Trainers only.
 */
export async function POST(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request, RequiredPermission.TRAINER);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const body: UpdatePayload = await context.request.json();
  const dt = DateTime.fromISO(`${body.date}T${body.time}`, {
    zone: "utc",
  });
  await DB.trainingSession.create({
    data: {
      trainer: auth.data.info.cid,
      dateTime: dt.toJSDate(),
      notes: body.notes,
    },
  });
  LOGGER.info(
    `${infoToName(
      auth.data.info,
    )} created a new session for ${dt.toISODate()} at ${dt.toLocaleString(
      DateTime.TIME_24_SIMPLE,
    )}`,
  );
  return new Response("Created", { status: 201 });
}
