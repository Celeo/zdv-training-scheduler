import type { APIContext } from "astro";
import {
  RequiredPermission,
  canBeTrainer,
  checkAuth,
  getUserInfoFromCid,
} from "../../../util/auth";
import { DB } from "../../../data/db";
import { SESSION_STATUS } from "../../../util/config";
import { dateToDateStr } from "../../../util/date";
import { InformTypes, informUser } from "../../../util/inform";

type UpdatePayload = {
  action: "ACCEPT" | "UNACCEPT" | "UPDATE_NOTES";
  notes: string | undefined;
};

/**
 * Edit a session.
 *
 * Trainers can edit any of their sessions.
 *
 * Students will use this endpoint to accept an
 * available session.
 */
export async function PUT(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  if (!context.params.id) {
    return new Response(null, { status: 404 });
  }
  const id = parseInt(context.params.id);
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }

  const record = await DB.trainingSession.findFirst({ where: { id } });
  if (!record) {
    return new Response(`Could not find record with id ${id}`, { status: 404 });
  }
  if (new Date(record.date) < new Date(dateToDateStr(new Date()))) {
    return new Response("You cannot edit a session in the past", {
      status: 400,
    });
  }

  const body: UpdatePayload = await context.request.json();
  if (body.action === "ACCEPT") {
    if (record.student !== null) {
      return new Response(
        "You cannot accept this session - it's already taken",
        { status: 400 },
      );
    }
    if (record.instructor === payload?.info.cid) {
      return new Response("You cannot accept your own session", {
        status: 400,
      });
    }
    await DB.trainingSession.update({
      where: { id: record.id },
      data: { student: payload!.info.cid, status: SESSION_STATUS.ACCEPTED },
    });
    await informUser(record.instructor, InformTypes.ACCEPTED_SESSION, {
      first_name: payload?.info.first_name,
      last_name: payload?.info.last_name,
      oi: payload?.info.oi,
      date: record.date,
      time: record.time,
    });
    return new Response("Accepted");
  } else if (body.action === "UNACCEPT") {
    if (record.student !== payload?.info.cid) {
      return new Response(
        "You cannot un-accept this session - you're not assigned to it",
      );
    }
    await DB.trainingSession.update({
      where: { id: record.id },
      data: { student: null, status: SESSION_STATUS.OPEN },
    });
    await informUser(record.instructor, InformTypes.STUDENT_CANCELLED_SESSION, {
      first_name: payload?.info.first_name,
      last_name: payload?.info.last_name,
      oi: payload?.info.oi,
      date: record.date,
      time: record.time,
    });
    return new Response("Un-accepted");
  } else {
    if (record.instructor !== payload?.info.cid) {
      return new Response(
        "You cannot edit the notes on someone else's session",
        { status: 400 },
      );
    }
    if (!canBeTrainer(payload.info)) {
      return new Response("You are not a trainer", { status: 403 });
    }
    await DB.trainingSession.update({
      where: { id: record.id },
      data: { notes: body.notes ?? "" },
    });
    return new Response("Notes updated");
  }
}

/**
 * Delete a session. Trainers only.
 */
export async function DELETE(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  if (!context.params.id) {
    return new Response(null, { status: 404 });
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
    return new Response(`Could not find record with id ${id}`, { status: 404 });
  }
  if (new Date(record.date) < new Date(dateToDateStr(new Date()))) {
    return new Response("You cannot edit a session in the past", {
      status: 400,
    });
  }

  if (record.instructor !== payload?.info.cid) {
    return new Response("You cannot delete someone else's session", {
      status: 400,
    });
  }
  if (record.student !== null) {
    const instructor = await getUserInfoFromCid(record.instructor);
    await informUser(record.student, InformTypes.TRAINER_CANCELLED_SESSION, {
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      oi: instructor.oi,
      date: record.date,
      time: record.time,
    });
  }
  await DB.trainingSession.delete({ where: { id: record.id } });
  return new Response("Session deleted");
}
