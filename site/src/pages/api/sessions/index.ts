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
import { infoToName } from "../../../util/print.ts";
import { schedulesOnDate } from "../../../util/schedules.ts";

/**
 * Get all sessions. 'date' is a required query param.
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
  const date = DateTime.fromISO(`${dateStr}T12:00:00`, {
    zone: context.locals.timezone,
  });

  const sessions = (await schedulesOnDate(date)).sessions;
  const returnSessions: Array<TrainingSession> = [];
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
      .forEach((session) => returnSessions.push(session));
  } else {
    // Now filter to sessions that are open. This cannot have been done as part of the DB
    // query, since we needed to know _all_ the sessions on the date to determine
    // which schedules should "tick".
    sessions
      .filter((session) => session.status === SESSION_STATUS.OPEN)
      .forEach((session) => returnSessions.push(session));
  }

  // sort by time of day for better UX
  returnSessions.sort(
    (a, b) =>
      DateTime.fromJSDate(a.dateTime).hour -
      DateTime.fromJSDate(b.dateTime).hour,
  );

  return new Response(JSON.stringify(returnSessions));
}

type UpdatePayload = {
  dateTime: string;
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
  const dt = DateTime.fromISO(body.dateTime, { zone: "utc" });
  await DB.trainingSession.create({
    data: {
      trainer: auth.data.info.cid,
      dateTime: dt.toJSDate(),
      notes: body.notes,
    },
  });
  LOGGER.info(
    `${infoToName(auth.data.info)} created a new session at ${dt.toString()}`,
  );
  return new Response("Created", { status: 201 });
}
