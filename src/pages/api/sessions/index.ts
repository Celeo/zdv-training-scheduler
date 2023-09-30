import type { APIContext } from "astro";
import { DB } from "../../../data/db";
import { checkAuth } from "../../../util/auth";
import { SESSION_STATUS } from "../../../util/config";

export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  const urlParams = new URL(context.request.url).searchParams;
  const date = urlParams.get("date");
  if (!date) {
    return new Response('Missing "date"', { status: 400 });
  }

  const limitToOpen = urlParams.get("limit-to-open");
  if (limitToOpen) {
    return new Response(
      JSON.stringify(
        await DB.trainingSession.findMany({
          where: { date, status: SESSION_STATUS.OPEN },
        }),
      ),
    );
  }
  return new Response(
    JSON.stringify(await DB.trainingSession.findMany({ where: { date } })),
  );
}

/**
 * Create a new session. Trainers only.
 */
export async function POST(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  // TODO
  return new Response(null, { status: 500 });
}

/**
 * Edit a session.
 *
 * Trainers can edit any of their sessions.
 *
 * Students will use this endpoint to accept an
 * available session.
 */
export async function PUT(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  // TODO
  return new Response(null, { status: 500 });
}

/**
 * Delete a session.
 *
 * Trainers can delete any of their sessions. If a student has
 * already accepted it, they will be notified.
 *
 * Students can cancel an existing reservation.
 *
 * TODO: needed reporting/auditing for late cancellation?
 */
export async function DELETE(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  // TODO
  return new Response(null, { status: 500 });
}
