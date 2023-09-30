import type { APIContext } from "astro";
import { canBeTrainer, checkAuth } from "../../../util/auth";
import { DB } from "../../../data/db";
import { SESSION_STATUS } from "../../../util/config";
import { dateToDateStr } from "../../../util/date";

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
    // TODO notify trainer
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
    // TODO notify trainer
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
  const { payload, shortCircuit } = await checkAuth(context.request);
  if (shortCircuit) {
    return shortCircuit;
  }
  if (!canBeTrainer(payload!.info)) {
    return new Response("You are not a trainer", { status: 403 });
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
    // TODO notify student
  }
  await DB.trainingSession.delete({ where: { id: record.id } });
  return new Response("Session deleted");
}
