import type { APIContext } from "astro";
import { DB } from "../../data.ts";
import { checkAuth } from "../../util/auth.ts";
import { LOGGER } from "../../util/log.ts";
import { infoToName } from "../../util/print.ts";

/**
 * Get the user's preferences.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  const preferences = await DB.userPreference.findFirst({
    where: { cid: payload!.info.cid },
  });
  return new Response(JSON.stringify(preferences));
}

type UpdatePayload = {
  discord: boolean;
  email: boolean;
};

/**
 * Update the user's preferences.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  const body: UpdatePayload = await context.request.json();
  await DB.userPreference.update({
    where: { cid: payload!.info.cid },
    data: {
      receiveEmails: body.email,
      receiveDiscordMessages: body.discord,
    },
  });
  LOGGER.info(
    `${infoToName(payload!.info)} updated their preferences: ${body.email}, ${
      body.discord
    }`,
  );
  return new Response("Updated");
}
