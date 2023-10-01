import type { APIContext } from "astro";
import { DB } from "../../../data/db";
import { RequiredPermission, checkAuth } from "../../../util/auth";
import { SESSION_STATUS } from "../../../util/config";

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
