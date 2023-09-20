import {
  PrismaClient,
  type TeacherRating,
  type TrainingSession,
  type TrainingSchedule,
  type UserBlocklist,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Look up teacher ratings by controller's CID.
 */
export async function getTeacherRating(
  cid: number,
): Promise<TeacherRating | null> {
  return await prisma.teacherRating.findFirst({ where: { cid } });
}

/**
 * Retrieve all training schedules.
 */
export async function getAllSchedules(): Promise<Array<TrainingSchedule>> {
  return await prisma.trainingSchedule.findMany();
}

/**
 * Retrieve all sessions, optionally limiting to those that are
 * open (i.e. for a trainee looking for availability).
 */
export async function getAllSessions(
  limitToOpen: boolean,
): Promise<Array<TrainingSession>> {
  if (limitToOpen) {
    return await prisma.trainingSession.findMany({
      where: { status: "open" },
    });
  }
  return await prisma.trainingSession.findMany();
}

/**
 * Return a CID block model, if present.
 *
 * Since JWTs live on the user's browser, there needs to be some way to
 * prevent their access of the site if needed, like for dismissals,
 * abuse, or mandate of the ATM/DATM/TA.
 */
export async function isCidBlocked(cid: number): Promise<UserBlocklist | null> {
  return await prisma.userBlocklist.findFirst({ where: { cid } });
}
