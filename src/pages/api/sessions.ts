import type { APIContext } from "astro";
import { DB } from "../../data/db";
import { checkAuth } from "../../util/auth";

export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
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
}

export async function POST(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  return new Response(null, { status: 404 });
}

export async function PATCH(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  return new Response(null, { status: 404 });
}

export async function DELETE(
  _context: APIContext<Record<string, any>>,
): Promise<Response> {
  return new Response(null, { status: 404 });
}
