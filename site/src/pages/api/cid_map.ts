import type { APIContext } from "astro";
import axios from "axios";
import { checkAuth } from "../../util/auth.ts";
import { loadConfig } from "../../util/config.ts";

export type ZdvRosterEntry = {
  cid: number;
  first_name: string;
  last_name: string;
  operating_initials: string;
};

export type CidMap = Record<number, Omit<ZdvRosterEntry, "cid">>;

/**
 * Get the ARTCC roster, mapping CID to name and OIs.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const config = await loadConfig();
  const resp = await axios.get<Array<ZdvRosterEntry>>(config.oauth.userRoster);
  const map: Record<number, Omit<ZdvRosterEntry, "cid">> = {};
  for (const entry of resp.data) {
    map[entry.cid] = {
      first_name: entry.first_name,
      last_name: entry.last_name,
      operating_initials: entry.operating_initials,
    };
  }
  return new Response(JSON.stringify(map));
}
