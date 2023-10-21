import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data.ts";
import { checkAuth } from "../../../util/auth.ts";
import { SESSION_STATUS } from "../../../util/constants.ts";

/*
 * TODO timezone support
 */

/**
 * Get the sessions that the current user is a student of.
 *
 * Optionally filter to just the sessions that are pending.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request);
  if (auth.kind === "invalid") {
    return auth.data;
  }
  const urlParams = new URL(context.request.url).searchParams;
  const pending = urlParams.get("pending");

  if (pending) {
    const now = DateTime.utc();
    let records = await DB.trainingSession.findMany({
      where: {
        student: auth.data.info.cid,
        status: SESSION_STATUS.ACCEPTED,
      },
    });
    records = records.filter((session) => {
      return DateTime.fromJSDate(session.dateTime) > now;
    });
    return new Response(JSON.stringify(records));
  }

  return new Response(
    JSON.stringify(
      await DB.trainingSession.findMany({
        where: { student: auth.data.info.cid },
      }),
    ),
  );
}
