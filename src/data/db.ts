import {
  PrismaClient,
  type TeacherRating,
  type TrainingSession,
  type TrainingSchedule,
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
