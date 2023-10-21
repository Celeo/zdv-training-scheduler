import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data";
import { RequiredPermission, checkAuth } from "../../../util/auth";

/*
 * TODO timezone support
 */

/**
 * Return all future sessions for the current user (trainer).
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request, RequiredPermission.TRAINER);
  if (auth.kind === "invalid") {
    return auth.data;
  }
  const sessions = await DB.trainingSession.findMany({
    where: { instructor: auth.data!.info.cid },
  });
  const now = DateTime.utc();
  const filtered = sessions.filter((s) => {
    const date = DateTime.fromISO(`${s.date}T${s.time}`, { zone: "utc" });
    return date > now;
  });
  return new Response(JSON.stringify(filtered));
}
