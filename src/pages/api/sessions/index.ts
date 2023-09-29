import type { APIContext } from "astro";
import { DB } from "../../../data/db";
import { checkAuth } from "../../../util/auth";

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
        await DB.trainingSession.findMany({ where: { date, status: "open" } }),
      ),
    );
  }
  return new Response(
    JSON.stringify(await DB.trainingSession.findMany({ where: { date } })),
  );
}

export async function POST(): Promise<Response> {
  await DB.trainingSession.create({
    data: {
      instructor: 1,
      date: "2023-09-24",
      status: "open",
    },
  });
  return new Response("Created", { status: 201 });
}
