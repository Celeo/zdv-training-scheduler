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
