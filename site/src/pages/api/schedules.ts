import type { APIContext } from "astro";
import { checkAuth } from "../../util/auth";
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
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  // TODO
  return new Response(null, { status: 500 });
}

/**
 * Edit a schedule. Trainers only. Only the
 * owning user can perform this action.
 */
export async function PUT(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  // TODO
  return new Response(null, { status: 500 });
}

/**
 * Delete a schedule. Trainers only. Only the
 * owning user can perform this action.
 */
export async function DELETE(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  // TODO
  return new Response(null, { status: 500 });
}
