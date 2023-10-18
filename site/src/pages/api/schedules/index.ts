import type { APIContext } from "astro";
import { DB } from "../../../data.js";
import { RequiredPermission, checkAuth } from "../../../util/auth.js";
import { LOGGER } from "../../../util/log.js";
import { infoToName } from "../../../util/print.js";

/**
 * Get the user's schedules.
 */
export async function GET(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(
    context.request,
    RequiredPermission.TRAINER,
  );
  if (shortCircuit) {
    return shortCircuit;
  }
  return new Response(
    JSON.stringify(
      await DB.trainingSchedule.findMany({
        where: { instructor: payload!.info.cid },
      }),
    ),
  );
}

type CreatePayload = {
  dayOfWeek: number;
  timeOfDay: string;
};

/**
 * Create a new schedule. Trainers only.
 */
export async function POST(
  context: APIContext<Record<string, any>>,
): Promise<Response> {
  const { payload, shortCircuit } = await checkAuth(
    context.request,
    RequiredPermission.TRAINER,
  );
  if (shortCircuit) {
    return shortCircuit;
  }
  const body: CreatePayload = await context.request.json();
  await DB.trainingSchedule.create({
    data: {
      instructor: payload!.info.cid,
      dayOfWeek: body.dayOfWeek,
      timeOfDay: body.timeOfDay,
    },
  });
  LOGGER.info(
    `${infoToName(payload!.info)} created schedule: ${body.dayOfWeek}, ${
      body.timeOfDay
    }`,
  );
  return new Response(null, { status: 201 });
}
