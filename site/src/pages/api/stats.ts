import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../data";
import { RequiredPermission, checkAuth } from "../../util/auth";

export type Stat = {
  cid: number;
  schedules: number;
  exclusions: number;
  sessionsPast: number;
  sessionsPending: number;
};
export type Stats = Array<Stat>;

export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const auth = await checkAuth(context.request, RequiredPermission.ADMIN);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const trainerCids = Array.from(
    new Set((await DB.trainerRating.findMany()).map((tr) => tr.cid)),
  );
  const schedules = await DB.trainingSchedule.findMany({
    include: { trainingScheduleExceptions: true },
  });
  const sessions = await DB.trainingSession.findMany();
  const now = DateTime.utc().toJSDate();

  const stats: Stats = trainerCids.map((cid) => ({
    cid,
    schedules: schedules.filter((s) => s.trainer === cid).length,
    exclusions: schedules
      .filter((s) => s.trainer === cid)
      .flatMap((s) => s.trainingScheduleExceptions).length,
    sessionsPast: sessions.filter((s) => s.trainer === cid && s.dateTime <= now)
      .length,
    sessionsPending: sessions.filter(
      (s) => s.trainer === cid && s.dateTime > now,
    ).length,
  }));

  return new Response(JSON.stringify(stats));
}
