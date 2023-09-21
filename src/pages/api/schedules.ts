import type { APIRoute } from "astro";
import { checkAuth } from "../../util/auth";
import { DB } from "../../data/db";

export const GET: APIRoute = async (context) => {
  const shortCircuit = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  return new Response(JSON.stringify(await DB.trainingSchedule.findMany()));
};
