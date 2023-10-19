import type { APIContext } from "astro";
import { DateTime } from "luxon";
import { DB } from "../../../data.ts";
import {
  RequiredPermission,
  canBeTrainer,
  checkAuth,
  getUserInfoFromCid,
} from "../../../util/auth.ts";
import { SESSION_STATUS } from "../../../util/constants.ts";
import { InformTypes, informUser } from "../../../util/inform.ts";
import { LOGGER } from "../../../util/log.ts";
import { infoToName } from "../../../util/print.ts";

type UpdatePayload = {
  action: "ACCEPT" | "UNACCEPT" | "UPDATE_NOTES";
  selectedPosition: string;
  date: string | null;
  scheduleId: number | null;
  notes?: string;
};

/**
 * Edit a session.
 *
 * Trainers can edit any of their sessions. Students will use this endpoint
 * to accept an available session.
 *
 * This function is quite long, as it handles several different user interactions.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  if (!context.params.id) {
    return new Response('Missing "id" URL parameter', { status: 404 });
  }
  const id = parseInt(context.params.id);
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  const body: UpdatePayload = await context.request.json();
  const record = await DB.trainingSession.findFirst({ where: { id } });
  if (!record) {
    /* could not find the session by id */

    if (body.scheduleId === null || body.date === null) {
      return new Response(
        `Unknown record ${id} and missing schedule ID and/or date`,
        { status: 400 },
      );
    }

    const schedule = await DB.trainingSchedule.findFirst({
      where: { id: body.scheduleId },
    });
    if (schedule === null) {
      // unknown session, unknown schedule
      return new Response(`Unknown schedule ${body.scheduleId}`, {
        status: 400,
      });
    }

    await DB.trainingSession.create({
      data: {
        scheduleId: body.scheduleId,
        instructor: schedule.instructor,
        student: payload?.info.cid!,
        selectedPosition: body.selectedPosition,
        date: body.date!,
        time: schedule.timeOfDay,
        status: SESSION_STATUS.ACCEPTED,
      },
    });
    LOGGER.info(
      `${infoToName(payload!.info)} created a session from schedule ${
        body.scheduleId
      } for ${body.date}T${schedule.timeOfDay}`,
    );
    return new Response("Accepted");
  }

  /* found the session by id */

  const recordDate = DateTime.fromISO(`${record.date}T${record.time}`, {
    zone: "utc",
  });
  if (recordDate < DateTime.utc()) {
    return new Response("Cannot edit a session in the past", { status: 400 });
  }

  if (body.action === "ACCEPT") {
    if (record.student !== null) {
      return new Response("Session already taken", { status: 400 });
    }
    if (record.instructor === payload?.info.cid) {
      return new Response("Cannot accept your own session", { status: 400 });
    }
    LOGGER.info(`${infoToName(payload!.info)} accepted session ${id}`);

    // accept the session and inform the trainer
    await DB.trainingSession.update({
      where: { id: record.id },
      data: {
        student: payload!.info.cid,
        status: SESSION_STATUS.ACCEPTED,
        selectedPosition: body.selectedPosition,
      },
    });
    await informUser(record.instructor, InformTypes.ACCEPTED_SESSION, {
      first_name: payload!.info.first_name,
      last_name: payload!.info.last_name,
      operating_initials: payload!.info.operating_initials,
      date: record.date,
      time: record.time,
    });
    LOGGER.info(
      `${infoToName(payload!.info)} accepted session ${id} for ${
        body.selectedPosition
      }`,
    );
    return new Response("Accepted");
  } else if (body.action === "UNACCEPT") {
    if (record.student !== payload?.info.cid) {
      return new Response(
        "You cannot un-accept this session - you're not assigned to it",
        { status: 400 },
      );
    }

    // open the session back up and inform the trainer
    await DB.trainingSession.update({
      where: { id: record.id },
      data: {
        student: null,
        status: SESSION_STATUS.OPEN,
        selectedPosition: null,
      },
    });
    await informUser(record.instructor, InformTypes.STUDENT_CANCELLED_SESSION, {
      first_name: payload!.info.first_name,
      last_name: payload!.info.last_name,
      operating_initials: payload!.info.operating_initials,
      date: record.date,
      time: record.time,
    });
    LOGGER.info(`${infoToName(payload!.info)} unaccepted session ${id}`);
    return new Response("Un-accepted");
  } else {
    /* update notes */

    if (!canBeTrainer(payload!.info)) {
      return new Response("You are not a trainer", { status: 403 });
    }
    if (record.instructor !== payload?.info.cid) {
      return new Response(
        "You cannot edit the notes on someone else's session",
        { status: 400 },
      );
    }
    await DB.trainingSession.update({
      where: { id: record.id },
      data: { notes: body.notes ?? "" },
    });
    LOGGER.info(`${infoToName(payload!.info)} updated notes for ${id}`);
    return new Response("Notes updated");
  }
}

type DeletePayload = {
  scheduleId?: number;
  date?: string;
};

/**
 * Delete a session. Trainers only.
 */
export async function DELETE(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  if (!context.params.id) {
    return new Response('Missing "id" URL parameter', { status: 404 });
  }
  const id = parseInt(context.params.id);
  const { payload, shortCircuit } = await checkAuth(
    context.request,
    RequiredPermission.TRAINER,
  );
  if (shortCircuit) {
    return shortCircuit;
  }

  const record = await DB.trainingSession.findFirst({ where: { id } });
  if (!record) {
    const body: DeletePayload = await context.request.json();
    if (body.scheduleId === undefined || body.date === undefined) {
      return new Response(
        `Could not find record with id ${id} and no schedule ID supplied`,
        { status: 400 },
      );
    }

    // create an exception for the schedule on this date
    await DB.trainingScheduleException.create({
      data: { scheduleId: body.scheduleId, date: body.date },
    });
    return new Response("Schedule exception created");
  }
  const recordDate = DateTime.fromISO(`${record.date}T00:00:00`, {
    zone: "utc",
  });
  if (recordDate < DateTime.utc()) {
    return new Response("You cannot edit a session in the past", {
      status: 400,
    });
  }
  if (record.instructor !== payload?.info.cid) {
    return new Response("You cannot delete someone else's session", {
      status: 400,
    });
  }

  // if a student already accepted the session, inform them that it's cancelled
  if (record.student !== null) {
    const instructor = await getUserInfoFromCid(record.instructor);
    await informUser(record.student, InformTypes.TRAINER_CANCELLED_SESSION, {
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      operating_initials: instructor.operating_initials,
      date: record.date,
      time: record.time,
    });
  }
  await DB.trainingSession.delete({ where: { id: record.id } });
  LOGGER.info(`${infoToName(payload!.info)} deleted session ${id}`);
  return new Response("Session deleted");
}
