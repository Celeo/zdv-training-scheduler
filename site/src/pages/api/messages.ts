import type { APIContext } from "astro";
import { loadConfig } from "../../util/config";
import { DB } from "../../data";

/**
 * Check the auth header for the Discord bot's token.
 *
 * Return an error `Response` if the header isn't present
 * or the value is incorrect.
 */
async function checkHeader(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader === null) {
    return new Response(null, { status: 401 });
  }
  const config = await loadConfig();
  if (`Bearer ${config.discordSecret}` !== authHeader) {
    return new Response(null, { status: 403 });
  }
  return null;
}

/**
 * Discord bot getting pending Discord messages.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const shortCircuit = await checkHeader(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  const messages = await DB.discordMessage.findMany({
    where: { completedAt: null },
  });
  return new Response(JSON.stringify(messages));
}

/**
 * Discord bot successfully sent a message; update DB.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const shortCircuit = await checkHeader(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  const urlParams = new URL(context.request.url).searchParams;
  const id = urlParams.get("id");
  if (id === null) {
    return new Response("No id", { status: 400 });
  }

  const record = await DB.discordMessage.findFirst({
    where: { id: parseInt(id) },
  });
  if (record === null) {
    return new Response("Message not found", { status: 400 });
  }

  await DB.discordMessage.update({
    where: { id: parseInt(id) },
    data: { completedAt: new Date() },
  });

  return new Response(null);
}
