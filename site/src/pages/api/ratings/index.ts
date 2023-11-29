import type { APIContext } from "astro";
import { DB } from "../../../data.ts";
import { RequiredPermission, checkAuth } from "../../../util/auth.ts";
import { loadConfig } from "../../../util/config.ts";
import { LOGGER } from "../../../util/log.ts";
import { infoToName } from "../../../util/print.ts";

export type TrainerRatingMapEntry = Record<
  string,
  { rated: boolean; friendly: string }
>;

export type TrainerRatingMap = Record<number, TrainerRatingMapEntry>;

/**
 * Get the stored trainer ratings as a map of CID to ratings.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const config = await loadConfig();
  const ratings = await DB.trainerRating.findMany();
  ratings.sort((a, b) => a.cid - b.cid);
  const map: TrainerRatingMap = {};
  for (const rating of ratings) {
    if (!(rating.cid in map)) {
      map[rating.cid] = {};
    }
    map[rating.cid]![rating.position] = {
      rated: rating.rated,
      friendly: config.positions.find(
        ([name, _]) => rating.position === name,
      )![1],
    };
  }
  return new Response(JSON.stringify(map));
}

type UpdatePayload = {
  cid: number;
  ratings: Record<string, boolean>;
};

/**
 * Update the stored trainer ratings for the CID.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request, RequiredPermission.ADMIN);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const body: UpdatePayload = await context.request.json();
  const ratings = await DB.trainerRating.findFirst({
    where: { cid: body.cid },
  });
  if (ratings === undefined) {
    return new Response(`Could not find ratings for cid ${body.cid}`, {
      status: 400,
    });
  }
  LOGGER.info(`${infoToName(auth.data.info)} updated ratings for ${body.cid}`);
  for (const key of Object.keys(body.ratings)) {
    await DB.trainerRating.updateMany({
      where: { cid: body.cid, position: key },
      data: { rated: body.ratings[key] ?? false },
    });
  }
  return new Response("Updated");
}
