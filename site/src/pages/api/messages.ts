import type { APIContext } from "astro";
import { DB } from "../../data.ts";
import { checkDiscordHeader } from "../../util/auth.ts";
import { LOGGER } from "../../util/log.ts";

/**
 * Discord bot retrieving pending Discord messages.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const shortCircuit = await checkDiscordHeader(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  const messages = await DB.discordMessage.findMany({
    where: { completedAt: null },
  });
  LOGGER.debug(`Discord bot checking messages, found ${messages.length}`);
  return new Response(JSON.stringify(messages));
}

/**
 * Discord bot reporting having sent the message.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const shortCircuit = await checkDiscordHeader(context.request);
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
