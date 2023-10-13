import type { APIContext } from "astro";
import { checkAuth } from "../../util/auth";

/**
 * Simple endpoint to verify the JWT and return the user info.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  return new Response(JSON.stringify(payload!.info));
}
