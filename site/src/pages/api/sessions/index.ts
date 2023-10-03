import type { APIContext } from "astro";
import { DB } from "../../../data/db";
import { RequiredPermission, checkAuth } from "../../../util/auth";
import { SESSION_STATUS } from "../../../util/contants";

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
  const urlParams = new URL(context.request.url).searchParams;
  const dateStr = urlParams.get("date");
  if (!dateStr) {
    return new Response('Missing "date"', { status: 400 });
  }
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1); // come up with a better fix

  const sessions = await DB.trainingSession.findMany({
    where: { date: dateStr },
  });
  const schedules = await DB.trainingSchedule.findMany({
    where: { dayOfWeek: date.getDay() },
  });
  const schedulesWithoutSessions = schedules.filter(
    (schedule) =>
      sessions.find((session) => session.scheduleId === schedule.id) ===
      undefined,
  );
  schedulesWithoutSessions
    .map((schedule) => ({
      id: -1,
      scheduleId: schedule.id,
      instructor: schedule.instructor,
      student: null,
      selectedPosition: null,
      date: dateStr,
      time: schedule.timeOfDay,
      status: SESSION_STATUS.OPEN,
      notes: "~~ Scheduled ~~",
      createdAt: date,
      updatedAt: date,
    }))
    .forEach((s) => sessions.push(s));

  return new Response(
    JSON.stringify(
      sessions.filter((session) => session.status === SESSION_STATUS.OPEN),
    ),
  );
}

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

  const body = await context.request.json();
  await DB.trainingSession.create({
    data: {
      instructor: payload!.info.cid,
      date: body.date,
      time: body.time,
    },
  });
  return new Response(null, { status: 201 });
}
