import type { APIContext } from "astro";
import { checkAuth } from "../../../util/auth";
import { DB } from "../../../data/db";

export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { info, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  if (!info) {
    return new Response("Undefined user", { status: 500 });
  }

  return new Response(
    JSON.stringify(
      await DB.trainingSession.findMany({ where: { student: info?.info.cid } }),
    ),
  );
}
