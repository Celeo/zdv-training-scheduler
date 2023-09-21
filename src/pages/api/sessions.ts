import type { APIRoute } from "astro";
import { DB } from "../../data/db";
import { checkAuth } from "../../util/auth";

export const GET: APIRoute = async (context) => {
  const shortCircuit = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  const urlParams = new URLSearchParams(context.request.url);
  const date = urlParams.get("date");
  if (!date) {
    return new Response('Missing "date"', { status: 400 });
  }

  const limitToOpen = urlParams.get("limit-to-open");
  if (limitToOpen) {
    return new Response(
      JSON.stringify(
        await DB.trainingSession.findMany({ where: { date, status: "open" } }),
      ),
    );
  }
  return new Response(
    JSON.stringify(await DB.trainingSession.findMany({ where: { date } })),
  );
};
