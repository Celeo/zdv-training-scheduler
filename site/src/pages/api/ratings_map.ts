import type { APIContext } from "astro";
import { checkAuth } from "../../util/auth";
import { DB } from "../../data";
import type { TeacherRating } from "@prisma/client";

type TrainerRatingEntry = Omit<
  TeacherRating,
  "cid" | "createdAt" | "updatedAt"
>;

export type TrainerRatingMap = Record<number, TrainerRatingEntry>;

/**
 * Get the stored trainer ratings, returned as a map from CID.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  const ratings = await DB.teacherRating.findMany();
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
