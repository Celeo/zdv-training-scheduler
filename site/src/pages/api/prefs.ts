import type { APIContext } from "astro";
import { DB } from "../../data";
import { checkAuth } from "../../util/auth";

type UpdatePayload = {
  discord: boolean;
  email: boolean;
};

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
  const prefs = await DB.userPreference.findFirst({
    where: { cid: payload!.info.cid },
  });
  return new Response(JSON.stringify(prefs));
}

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
  return new Response("Updated");
}
