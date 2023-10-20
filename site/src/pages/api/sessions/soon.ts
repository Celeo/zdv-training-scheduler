import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data";
import { checkDiscordHeader } from "../../../util/auth";
import { SESSION_STATUS } from "../../../util/constants";

export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const shortCircuit = await checkDiscordHeader(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  const sessions = await DB.trainingSession.findMany({
    where: { status: SESSION_STATUS.ACCEPTED },
  });

  const now = DateTime.utc();
  const inNextHour = [];
  for (const session of sessions) {
    const dt = DateTime.fromISO(`${session.date}T${session.time}`, {
      zone: "utc",
    });
    if (now < dt && dt.toMillis() - now.toMillis() < 1_000 * 60 * 60) {
      inNextHour.push(session);
    }
  }

  return new Response(JSON.stringify(inNextHour));
}
