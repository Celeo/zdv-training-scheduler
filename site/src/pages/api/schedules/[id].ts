import type { APIContext } from "astro";
import { DB } from "../../../data";
import { RequiredPermission, checkAuth } from "../../../util/auth";
import { LOGGER } from "../../../util/log";
import { infoToName } from "../../../util/print";

/**
 * Delete a schedule. Trainers only. Only the
 * owning user can perform this action.
 *
 * Any sessions that have already been accepted by
 * students will not be deleted as part of this action.
 */
export async function DELETE(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  if (!context.params.id) {
    return new Response('Missing "id" URL parameter', { status: 404 });
  }
  const id = parseInt(context.params.id);
  const auth = await checkAuth(context.request, RequiredPermission.TRAINER);
  if (auth.kind === "invalid") {
    return auth.data;
  }

  const record = await DB.trainingSchedule.findFirst({
    where: { id: id },
  });
  if (record === null) {
    return new Response("Could not find schedule", { status: 400 });
  }
  if (record.trainer !== auth.data.info.cid) {
    return new Response("You cannot delete someone else's schedule", {
      status: 400,
    });
  }

  LOGGER.info(`${infoToName(auth.data.info)} deleted schedule ${id}`);
  // disconnect existing sessions, delete the exclusions, and delete the schedule
  await DB.trainingSession.updateMany({
    where: { scheduleId: id },
    data: { scheduleId: null },
  });
  await DB.trainingScheduleException.deleteMany({ where: { scheduleId: id } });
  await DB.trainingSchedule.delete({ where: { id } });

  return new Response("Deleted", { status: 200 });
}
