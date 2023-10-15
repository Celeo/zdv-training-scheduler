import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { DB } from "../src/data";
import { loadConfig } from "../src/util/config";
import { TRAINER_ROLES } from "../src/util/constants";

type RosterData = Array<{
  cid: number;
  roles: Array<string>;
}>;

const client = new PrismaClient();
const config = await loadConfig();

const trainers = [];
const resp = await axios.get<RosterData>(config.oauth.userRoster);
for (const entry of resp.data) {
  if (TRAINER_ROLES.some((role) => entry.roles.includes(role))) {
    trainers.push(entry.cid);
  }
}

const existing = (
  await client.teacherRating.findMany({
    select: { cid: true },
    where: { cid: { in: trainers } },
  })
).map(({ cid }) => cid);

for (const cid of trainers) {
  if (existing.includes(cid)) {
    continue;
  }
  console.log(`Adding record for ${cid}`);
  await DB.teacherRating.create({ data: { cid } });
}
