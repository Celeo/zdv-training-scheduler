import type { APIContext } from "astro";
import { checkAuth } from "../../util/auth";
import { loadConfig } from "../../util/config";

export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const config = await loadConfig();
  return new Response(JSON.stringify(config.positions));
}
