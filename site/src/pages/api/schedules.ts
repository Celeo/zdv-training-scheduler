import type { APIContext } from "astro";
import { RequiredPermission, checkAuth } from "../../util/auth.ts";
import { DB } from "../../data.ts";

/**
 * Get all schedules.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  return new Response(JSON.stringify(await DB.trainingSchedule.findMany()));
}

/**
 * Create a new schedule. Trainers only.
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
  await DB.trainingSchedule.create({
    data: {
      instructor: payload!.info.cid,
      dayOfWeek: body.dayOfWeek,
      timeOfDay: body.timeOfDay,
    },
  });
  return new Response(null, { status: 201 });
}

/**
 * Delete a schedule. Trainers only. Only the
 * owning user can perform this action.
 *
 * Note that any sessions that have already been accepted
 * by students will not be deleted as part of this action.
 */
export async function DELETE(
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
  const record = await DB.trainingSchedule.findFirst({
    where: { id: body.id },
  });
  if (record === null) {
    return new Response("Could not find schedule", { status: 400 });
  }
  if (record.instructor !== payload?.info.cid) {
    return new Response("You cannot delete someone else's schedule", {
      status: 400,
    });
  }
  // disconnect existing sessions
  await DB.trainingSession.updateMany({
    where: { scheduleId: body.id },
    data: { scheduleId: null },
  });
  // delete the schedule
  await DB.trainingSchedule.delete({ where: { id: body.id } });
  return new Response(null, { status: 200 });
}
