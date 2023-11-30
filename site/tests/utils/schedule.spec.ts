import { DateTime } from "luxon";
import { describe, expect, test, vi } from "vitest";
import { schedulesOnDate } from "../../src/util/schedules.ts";

const LA = "America/Los_Angeles";

describe("util/schedule", () => {
  function getDbMock() {
    return {
      trainingSession: { findMany: vi.fn() },
      trainingSchedule: { findMany: vi.fn() },
    };
  }

  test("no return when no schedules", async () => {
    const dbMock = getDbMock();
    dbMock.trainingSession.findMany.mockImplementation(() => []);
    dbMock.trainingSchedule.findMany.mockImplementation(() => []);

    const ret = await schedulesOnDate(
      DateTime.fromISO("2023-11-10T12:00:00", { zone: LA }),
      dbMock as any,
    );
    expect(ret.schedules.length).toBe(0);
    expect(ret.sessions.length).toBe(0);
  });

  test("returns the schedule when no sessions", async () => {
    const dbMock = getDbMock();
    dbMock.trainingSession.findMany.mockImplementation(() => []);
    dbMock.trainingSchedule.findMany.mockImplementation(() => [
      {
        id: 24,
        trainer: 1000000,
        dayOfWeek: 5,
        timeOfDay: "20:00",
        trainingScheduleExceptions: [],
      },
    ]);

    const ret = await schedulesOnDate(
      DateTime.fromISO("2023-12-01T12:00:00", { zone: LA }),
      dbMock as any,
    );
    expect(ret.schedules.length).toBe(1);
    expect(ret.sessions.length).toBe(1);
    expect(ret.schedules[0]?.id).toBe(24);
    expect(ret.sessions[0]?.id).toBe(-1);
  });

  test("schedules with exclusions are filtered out", async () => {
    const dbMock = getDbMock();
    dbMock.trainingSession.findMany.mockImplementation(() => []);
    dbMock.trainingSchedule.findMany.mockImplementation(() => [
      {
        id: 24,
        trainer: 1000000,
        dayOfWeek: 5,
        timeOfDay: "20:00",
        trainingScheduleExceptions: [
          {
            id: 285,
            scheduleId: 24,
            date: "2023-12-01",
          },
        ],
      },
    ]);

    const ret = await schedulesOnDate(
      DateTime.fromISO("2023-12-01T12:00:00", { zone: LA }),
      dbMock as any,
    );
    expect(ret.schedules.length).toBe(0);
    expect(ret.sessions.length).toBe(0);
  });
});
