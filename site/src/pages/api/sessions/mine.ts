import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data.ts";
import { checkAuth } from "../../../util/auth.ts";
import { SESSION_STATUS } from "../../../util/constants.ts";

/**
 * Get the sessions that the current user is a student of.
 *
 * Optionally filter to just the sessions that are pending.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  const urlParams = new URL(context.request.url).searchParams;
  const pending = urlParams.get("pending");

  if (pending) {
    const now = DateTime.utc();
    let records = await DB.trainingSession.findMany({
      where: {
        student: payload!.info.cid,
        status: SESSION_STATUS.ACCEPTED,
      },
    });
    records = records.filter((session) => {
      const sessionDateTime = DateTime.fromISO(
        `${session.date}T${session.time}`,
        { zone: "utc" },
      );
      return sessionDateTime > now;
    });
    return new Response(JSON.stringify(records));
  }
  return new Response(
    JSON.stringify(
      await DB.trainingSession.findMany({
        where: { student: payload!.info.cid },
      }),
    ),
  );
}
