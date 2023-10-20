import type { TeacherRating } from "@prisma/client";
import type { APIContext } from "astro";
import { DB } from "../../../data.ts";
import { RequiredPermission, checkAuth } from "../../../util/auth.ts";
import { LOGGER } from "../../../util/log.ts";
import { infoToName } from "../../../util/print.ts";

export type TrainerRatingEntry = Omit<
  TeacherRating,
  "cid" | "createdAt" | "updatedAt"
>;

export type TrainerRatingMap = Record<number, TrainerRatingEntry>;

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

  const ratings = await DB.teacherRating.findMany();
  ratings.sort((a, b) => a.cid - b.cid);
  const map: Record<number, TrainerRatingEntry> = {};
  for (const rating of ratings) {
    map[rating.cid] = {
      minorGround: rating.minorGround,
      majorGround: rating.majorGround,
      minorTower: rating.minorTower,
      majorTower: rating.majorTower,
      minorApproach: rating.minorApproach,
      majorApproach: rating.majorApproach,
      center: rating.center,
    };
  }
  return new Response(JSON.stringify(map));
}

type UpdatePayload = Omit<TeacherRating, "createdAt" | "updatedAt">;

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
  const ratings = await DB.teacherRating.findFirst({
    where: { cid: body.cid },
  });
  if (ratings === undefined) {
    return new Response(`Could not find ratings for cid ${body.cid}`, {
      status: 400,
    });
  }
  LOGGER.info(`${infoToName(auth.data.info)} updated ratings for ${body.cid}`);
  await DB.teacherRating.update({ where: { cid: body.cid }, data: body });
  return new Response("Updated");
}
