import type { APIContext } from "astro";
import axios from "axios";
import { DB } from "../../../data";
import { RequiredPermission, checkAuth } from "../../../util/auth";
import { loadConfig } from "../../../util/config";
import { TRAINER_ROLES } from "../../../util/constants";
import { LOGGER } from "../../../util/log";
import { infoToName } from "../../../util/print";

type RosterData = Array<{
  cid: number;
  roles: Array<string>;
}>;

export async function POST(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request, RequiredPermission.ADMIN);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const config = await loadConfig();
  const stored = await DB.teacherRating.findMany();
  const roster = [];
  LOGGER.info(`${infoToName(auth.data.info)} is synchronizing the roster`);

  const resp = await axios.get<RosterData>(config.oauth.userRoster);
  for (const entry of resp.data) {
    if (TRAINER_ROLES.some((role) => entry.roles.includes(role))) {
      roster.push(entry.cid);
    }
  }

  for (const user of stored) {
    if (!roster.some((r) => r === user.cid)) {
      LOGGER.info(`Removing ${user.cid} from trainer roster`);
      await DB.teacherRating.delete({ where: { cid: user.cid } });
    }
  }
  for (const user of roster) {
    if (!stored.some((s) => s.cid === user)) {
      LOGGER.info(`Adding ${user} to trainer roster`);
      await DB.teacherRating.create({ data: { cid: user } });
    }
  }
  LOGGER.info("Roster sync finished");

  return new Response("Updated");
}
