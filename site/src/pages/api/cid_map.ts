import type { APIContext } from "astro";
import { loadConfig } from "../../util/config.ts";
import axios from "axios";
import { checkAuth } from "../../util/auth.ts";

type ZdvRosterEntry = {
  cid: number;
  first_name: string;
  last_name: string;
  operating_initials: string;
};

/**
 * CID to name mapping
 */
export type CidMap = Record<number, Omit<ZdvRosterEntry, "cid">>;

/**
 * Get the ARTCC roster, mapping CID to name.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
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
