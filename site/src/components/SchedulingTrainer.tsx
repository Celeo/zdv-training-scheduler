import type {
  TrainingSchedule,
  TrainingScheduleException,
} from "@prisma/client";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { sendAlert } from "../data.ts";
import type { CidMap } from "../pages/api/cid_map.ts";
import { callEndpoint } from "../util/http.ts";
import { DateDisplayTypes, dateToStr, infoToName } from "../util/print.ts";
import type { TrainingSession_DT, Value } from "../util/types.ts";
import { ExistingSchedule } from "./ExistingSchedule.tsx";

export function SchedulingTrainer() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [sessions, setSessions] = useState<Array<TrainingSession_DT>>([]);
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionNotes, setNewSessionNotes] = useState("");
  const [newScheduleDayOfWeek, setNewScheduleDayOfWeek] = useState(-1);
  const [newScheduleTimeOfDay, setNewScheduleTimeOfDay] = useState("");
  const [schedules, setSchedules] = useState<
    Array<
      TrainingSchedule & {
        trainingScheduleExceptions: Array<TrainingScheduleException>;
      }
    >
  >([]);

  useEffect(() => {
    callEndpoint("/api/schedules", { setHook: setSchedules });
    callEndpoint("/api/sessions/trainer", { setHook: setSessions });
    callEndpoint("/api/cid_map", { setHook: setCidMap });
  }, []);

  /**
   * Called to create a new session.
   */
  const createNewSession = async (): Promise<void> => {
    try {
      const day = DateTime.fromJSDate(selectedDate as Date).toISODate();
      const dt = DateTime.fromISO(`${day}T${newSessionTime}:00`);
      await callEndpoint("/api/sessions", {
        method: "POST",
        body: {
          dateTime: dt,
          notes: newSessionNotes,
        },
      });
      setNewSessionTime("");
      setNewSessionNotes("");
      await callEndpoint("/api/sessions/trainer", { setHook: setSessions });
    } catch (err) {
      console.error(`Error creating new session: ${err}`);
      sendAlert("ERROR", "Could not create new session");
    }
  };

  /**
   * Called to create a new schedule.
   */
  const createNewSchedule = async (): Promise<void> => {
    try {
      await callEndpoint("/api/schedules", {
        method: "POST",
        // purposefully left in the user's timezone here
        body: {
          dayOfWeek: newScheduleDayOfWeek,
          timeOfDay: newScheduleTimeOfDay,
        },
      });
      sendAlert("INFO", "Schedule created");
      setNewScheduleDayOfWeek(-1);
      setNewScheduleTimeOfDay("");
      await callEndpoint("/api/schedules", { setHook: setSchedules });
    } catch (err) {
      console.error(`Error creating new schedule: ${err}`);
      sendAlert("ERROR", "Could not create new schedule");
    }
  };

  /**
   * Trainer cancelling a session that may or may not
   * have had a student accept.
   */
  const cancelSession = async (id: number): Promise<void> => {
    try {
      await callEndpoint(`/api/sessions/${id}`, { method: "DELETE" });
      sendAlert("INFO", "Session deleted");
      await callEndpoint("/api/sessions/trainer", { setHook: setSessions });
    } catch (err) {
      console.error(`Error deleting existing session: ${err}`);
      sendAlert("ERROR", "Could not delete session");
    }
  };

  return (
    <>
      <div className="pb-5">
        <h2 className="text-2xl pb-2">Your schedules</h2>
        {schedules.length === 0 ? (
          <p className="pb-5">No schedules</p>
        ) : (
          <ul className="list-disc list-inside basis-4/12 pb-5">
            {schedules.map((schedule) => (
              <ExistingSchedule
                key={schedule.id}
                schedule={schedule}
                updateTrigger={() =>
                  callEndpoint("/api/schedules", { setHook: setSchedules })
                }
              />
            ))}
          </ul>
        )}
        <h3 className="text-lg pb-2">Create new schedule</h3>
        <div className="flex-1">
          <div className="flex flex-items justify-start gap-x-5 mb-3">
            <select
              className="block border text-sm rounded-md w-1/4 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
              onChange={(e) =>
                setNewScheduleDayOfWeek(parseInt(e.target.value))
              }
              value={newScheduleDayOfWeek}
            >
              <option value={-1} disabled>
                Day of week
              </option>
              <option value={0}>Sundays</option>
              <option value={1}>Mondays</option>
              <option value={2}>Tuesdays</option>
              <option value={3}>Wednesdays</option>
              <option value={4}>Thursdays</option>
              <option value={5}>Fridays</option>
              <option value={6}>Saturdays</option>
            </select>
            <select
              className="block border text-sm rounded-md w-1/4 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
              onChange={(e) => setNewScheduleTimeOfDay(e.target.value)}
              value={newScheduleTimeOfDay}
            >
              <option value="" disabled>
                Time of day
              </option>
              {[...Array(24).keys()].map((i) => {
                const time = i.toString().padStart(2, "0") + ":00";
                return (
                  <option key={time} value={time}>
                    {time}
                  </option>
                );
              })}
            </select>
            <button
              className={`text-black focus:ring-4 focus:outline-none rounded-xl w-1/4 text-sm px-5 py-1 text-center ${
                newScheduleTimeOfDay === "" || newScheduleDayOfWeek === -1
                  ? "bg-gray-500"
                  : "bg-sky-400 hover:bg-sky-300"
              }`}
              disabled={
                newScheduleTimeOfDay === "" || newScheduleDayOfWeek === -1
              }
              onClick={createNewSchedule}
            >
              Create
            </button>
          </div>
        </div>
      </div>
      <hr className="pb-5" />
      <h2 className="text-2xl pb-2">Your sessions</h2>
      {sessions.length === 0 ? (
        <p className="pb-5">No pending sessions</p>
      ) : (
        <ul className="list-disc list-inside basis-4/12 pb-5">
          {sessions.map((s) => (
            <li key={s.id}>
              {s.student !== null
                ? `${dateToStr(
                    s.dateTime,
                    DateDisplayTypes.DateAndTime,
                  )} with ${
                    s.student in cidMap
                      ? infoToName(cidMap[s.student]!)
                      : s.student
                  } on ${s.position}`
                : `${dateToStr(
                    s.dateTime,
                    DateDisplayTypes.DateAndTime,
                  )} (unclaimed)`}
              <button
                className="focus:outline-none focus:ring-4 font-medium rounded-xl text-sm px-2 py-1 text-center mb-2 ml-2 text-red-500 hover:text-white hover:bg-red-700 focus:ring-red-900"
                onClick={() => {
                  cancelSession(s.id);
                }}
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
      <h3 className="text-lg pb-2">Create new session</h3>
      <div className="flex justify-between items-start space-x-10">
        <div className="text-black flex-none">
          <Calendar
            onChange={(val) => setSelectedDate(val)}
            value={selectedDate}
            minDate={new Date()}
            minDetail="year"
            view="month"
            locale="en-US"
            prev2Label={null}
            next2Label={null}
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-items justify-start gap-x-5 mb-3">
            <select
              className="block border text-sm rounded-md w-1/3 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
              onChange={(e) => setNewSessionTime(e.target.value)}
              value={newSessionTime}
            >
              <option value="" disabled>
                Time
              </option>
              {[...Array(24).keys()].map((i) => {
                const time = i.toString().padStart(2, "0") + ":00";
                return (
                  <option key={time} value={time}>
                    {time}
                  </option>
                );
              })}
            </select>
            <input
              type="text"
              placeholder="Notes (optional)"
              className="border text-sm rounded-md block w-1/3 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
              value={newSessionNotes}
              onChange={(e) => setNewSessionNotes(e.target.value)}
            />
            <button
              className={`text-black focus:ring-4 focus:outline-none rounded-xl w-1/3 text-sm px-5 py-1 text-center ${
                selectedDate === null || newSessionTime === ""
                  ? "bg-gray-500"
                  : "bg-sky-400 hover:bg-sky-300"
              }`}
              disabled={selectedDate === null || newSessionTime === ""}
              onClick={createNewSession}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
