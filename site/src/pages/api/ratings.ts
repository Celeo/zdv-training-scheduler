import type { APIContext } from "astro";
import { RequiredPermission, checkAuth } from "../../util/auth.ts";
import { DB } from "../../data.ts";
import type { TeacherRating } from "@prisma/client";

export type TrainerRatingEntry = Omit<
  TeacherRating,
  "cid" | "createdAt" | "updatedAt"
>;

export type TrainerRatingMap = Record<number, TrainerRatingEntry>;

type UpdatePayload = Omit<TeacherRating, "createdAt" | "updatedAt">;

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

/**
 * Update the stored trainer ratings for the CID.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { shortCircuit } = await checkAuth(
    context.request,
    RequiredPermission.ADMIN,
  );
  if (shortCircuit) {
    return shortCircuit;
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
  await DB.teacherRating.update({ where: { cid: body.cid }, data: body });
  return new Response("Updated");
}
