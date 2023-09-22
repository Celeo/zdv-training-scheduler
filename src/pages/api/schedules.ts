import type { APIContext } from "astro";
import { checkAuth } from "../../util/auth";
import { DB } from "../../data/db";

export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const shortCircuit = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  return new Response(JSON.stringify(await DB.trainingSchedule.findMany()));
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
