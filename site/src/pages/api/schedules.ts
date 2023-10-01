import type { APIContext } from "astro";
import { RequiredPermission, checkAuth } from "../../util/auth";
import { DB } from "../../data/db";

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
  // TODO
  return new Response(null, { status: 500 });
}

/**
 * Edit a schedule. Trainers only. Only the
 * owning user can perform this action.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(
    context.request,
    RequiredPermission.TRAINER,
  );
  if (shortCircuit) {
    return shortCircuit;
  }
  // TODO
  return new Response(null, { status: 500 });
}

/**
 * Delete a schedule. Trainers only. Only the
 * owning user can perform this action.
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
  // TODO
  return new Response(null, { status: 500 });
}
