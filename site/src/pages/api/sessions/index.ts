import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data.ts";
import { RequiredPermission, checkAuth } from "../../../util/auth.ts";
import { SESSION_STATUS } from "../../../util/constants.ts";

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
  const { shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  // 'date' URL parameter is required
  const urlParams = new URL(context.request.url).searchParams;
  const dateStr = urlParams.get("date");
  if (!dateStr) {
    return new Response('Missing "date"', { status: 400 });
  }
  const date = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: "utc" });

  // find the sessions on the date and the schedules on the day of the week
  const sessions = await DB.trainingSession.findMany({
    where: { date: dateStr },
  });
  const schedules = await DB.trainingSchedule.findMany({
    where: { dayOfWeek: date.weekday },
    include: { trainingScheduleException: true },
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
        !schedule.trainingScheduleException.some(
          (except) => except.date === dateStr,
        ),
    )
    .map((schedule) => ({
      id: -1,
      scheduleId: schedule.id,
      instructor: schedule.instructor,
      student: null,
      selectedPosition: null,
      date: dateStr,
      time: schedule.timeOfDay,
      status: SESSION_STATUS.OPEN,
      notes: "",
      createdAt: date.toJSDate(),
      updatedAt: date.toJSDate(),
    }))
    .forEach((s) => sessions.push(s));

  // Now filter to sessions that are open. This cannot have been done as part of the DB
  // query, since we needed to know _all_ the sessions on the date to determine
  // which schedules should "tick".
  const open = sessions.filter(
    (session) => session.status === SESSION_STATUS.OPEN,
  );
  open.sort(
    (a, b) => parseInt(a.time.split(":")[0]!) - parseInt(b.time.split(":")[0]!),
  );

  return new Response(JSON.stringify(open));
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
  const { payload, shortCircuit } = await checkAuth(
    context.request,
    RequiredPermission.TRAINER,
  );
  if (shortCircuit) {
    return shortCircuit;
  }

  const body: UpdatePayload = await context.request.json();
  await DB.trainingSession.create({
    data: {
      instructor: payload!.info.cid,
      date: body.date,
      time: body.time,
      notes: body.notes,
    },
  });
  return new Response("Created", { status: 201 });
}
