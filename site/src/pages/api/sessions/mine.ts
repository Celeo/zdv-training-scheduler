import type { APIContext } from "astro";
import { checkAuth } from "../../../util/auth";
import { DB } from "../../../data/db";
import { SESSION_STATUS } from "../../../util/config";

/**
 * Get the sessions that the current user is a student of.
 *
 * Optionally filter to just the sessions that are accepted.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  const urlParams = new URL(context.request.url).searchParams;
  const accepted = urlParams.get("accepted");

  if (accepted) {
    return new Response(
      JSON.stringify(
        await DB.trainingSession.findMany({
          where: {
            student: payload!.info.cid,
            status: SESSION_STATUS.ACCEPTED,
          },
        }),
      ),
    );
  }
  return new Response(
    JSON.stringify(
      await DB.trainingSession.findMany({
        where: { student: payload!.info.cid },
      }),
    ),
  );
}
