import type { TrainingSchedule, TrainingSession } from "@prisma/client";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { sendAlert } from "../data.ts";
import type { Value } from "../util/calendarTypes.ts";
import { callEndpoint } from "../util/http.ts";
import { ExistingSchedule } from "./ExistingSchedule.tsx";

export function SchedulingTrainer() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionNotes, setNewSessionNotes] = useState("");
  const [newScheduleDayOfWeek, setNewScheduleDayOfWeek] = useState(-1);
  const [newScheduleTimeOfDay, setNewScheduleTimeOfDay] = useState("");
  const [schedules, setSchedules] = useState<Array<TrainingSchedule>>([]);

  useEffect(() => {
    (async () => {
      await callEndpoint("/api/schedules", { setHook: setSchedules });
      await callEndpoint("/api/sessions/instructor", { setHook: setSessions });
    })();
  }, []);

  /**
   * Called to create a new session.
   */
  const createNewSession = async (): Promise<void> => {
    try {
      const dt = DateTime.fromJSDate(selectedDate as Date);
      const ds = `${dt.year}-${dt.month.toString().padStart(2, "0")}-${dt.day
        .toString()
        .padStart(2, "0")}`;
      await callEndpoint("/api/sessions", {
        method: "POST",
        body: {
          date: ds,
          time: newSessionTime,
          notes: newSessionNotes,
        },
      });
      setNewSessionTime("");
      setNewSessionNotes("");
      await callEndpoint("/api/sessions/instructor", { setHook: setSessions });
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

  return (
    <>
      <div className="pb-5">
        <h2 className="text-2xl pb-2">Your schedules</h2>
        <ul className="list-disc list-inside basis-4/12 pb-5">
          {schedules.length === 0 ? (
            <p>No schedules</p>
          ) : (
            schedules.map((schedule) => (
              // TODO show exclusion days
              <ExistingSchedule key={schedule.id} schedule={schedule} />
            ))
          )}
        </ul>
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
        <p>No pending sessions</p>
      ) : (
        <ul className="list-disc list-inside basis-4/12 pb-5">
          {/* TODO cancel buttons */}
          {sessions.map((s) =>
            s.student !== null ? (
              <li key={s.id}>
                {s.date} at {s.time} with {s.student} on {s.selectedPosition}
              </li>
            ) : (
              <li key={s.id}>
                {s.date} at {s.time} (unclaimed)
              </li>
            ),
          )}
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
              Create session
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
