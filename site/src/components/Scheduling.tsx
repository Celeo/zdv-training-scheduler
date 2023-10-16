import type { TrainingSchedule, TrainingSession } from "@prisma/client";
import * as jose from "jose";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { sendAlert } from "../data.ts";
import type { CidMap } from "../pages/api/cid_map.ts";
import type { JwtPayload } from "../util/auth.ts";
import type { Value } from "../util/calendarTypes.ts";
import { TRAINER_ROLES } from "../util/constants.ts";
import { callEndpoint } from "../util/http.ts";
import { AvailableSession } from "./AvailableSession.tsx";
import { ExistingSchedule } from "./ExistingSchedule.tsx";
import { PendingSession } from "./PendingSession.tsx";

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [mySessions, setMySessions] = useState<Array<TrainingSession>>([]);
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [ratingMap, setRatingMap] = useState<{}>({});
  const [isTrainer, setIsTrainer] = useState(false);
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionNotes, setNewSessionNotes] = useState("");
  const [newScheduleDayOfWeek, setNewScheduleDayOfWeek] = useState(-1);
  const [newScheduleTimeOfDay, setNewScheduleTimeOfDay] = useState("");
  const [currentUserCid, setCurrentUserCid] = useState(-1);
  const [userSchedules, setUserSchedules] = useState<Array<TrainingSchedule>>(
    [],
  );

  /**
   * Called when the user selects a date on the calendar.
   */
  const selectDay = async (val: Value): Promise<void> => {
    setSelectedDate(val);
    setNewSessionTime("");
    setNewSessionNotes("");
    const date = val as Date;
    try {
      const dt = DateTime.fromJSDate(date);
      const ds = `${dt.year}-${dt.month.toString().padStart(2, "0")}-${dt.day
        .toString()
        .padStart(2, "0")}`;

      await callEndpoint(`/api/sessions?date=${ds}`, { setHook: setSessions });
    } catch (err) {
      console.error(`Error getting sessions for ${date}: ${err}`);
      sendAlert("ERROR", "Could not get sessions");
    }
  };

  /**
   * Called to create a new session by a trainer.
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
      await selectDay(selectedDate);
    } catch (err) {
      console.error(`Error creating new session: ${err}`);
      sendAlert("ERROR", "Could not create new session");
    }
  };

  /**
   * Called to create a new schedule by a trainer.
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
      await callEndpoint("/api/schedules", { setHook: setUserSchedules });
    } catch (err) {
      console.error(`Error creating new schedule: ${err}`);
      sendAlert("ERROR", "Could not create new schedule");
    }
  };

  // retrieve schedules and the current user's pending sessions
  useEffect(() => {
    (async () => {
      await Promise.all([
        callEndpoint("/api/sessions/mine?pending=true", {
          setHook: setMySessions,
        }),
        callEndpoint("/api/cid_map", { setHook: setCidMap }),
        callEndpoint("/api/ratings", { setHook: setRatingMap }),
      ]);

      const jwt = localStorage.getItem("jwt");
      if (jwt) {
        const claims = jose.decodeJwt(jwt) as JwtPayload;
        const isTrainer =
          claims.info.roles.includes("wm") ||
          claims.info.roles.some((r) => TRAINER_ROLES.includes(r));
        if (isTrainer) {
          await callEndpoint("/api/schedules", { setHook: setUserSchedules });
        }
        setIsTrainer(isTrainer);
        setCurrentUserCid(claims.info.cid);
      }
    })();
  }, []);

  let sessionsBody;
  if (selectedDate === null) {
    sessionsBody = <h3 className="text-xl">Select a date on the calendar</h3>;
  } else {
    sessionsBody = (
      <>
        {isTrainer && (
          <div className="flex flex-items justify-center gap-x-5 mb-3">
            <select
              className="block border text-sm rounded-lg w-1/4 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
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
              className="border text-sm rounded-lg block w-1/4 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
              value={newSessionNotes}
              onChange={(e) => setNewSessionNotes(e.target.value)}
            />
            <button
              className={`text-black focus:ring-4 focus:outline-none rounded-md w-1/4 text-sm px-5 py-1 text-center ${
                newSessionTime === ""
                  ? "bg-gray-500"
                  : "bg-secondary hover:bg-accent"
              }`}
              disabled={newSessionTime === ""}
              onClick={createNewSession}
            >
              Create session
            </button>
          </div>
        )}
        <h3 className="text-xl pb-2">Open sessions</h3>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <AvailableSession
              key={session.id}
              session={session}
              cidMap={cidMap}
              ratingMap={ratingMap}
              pendingSessions={mySessions.length}
              currentUserCid={currentUserCid}
            />
          ))
        ) : (
          <p className="text-md">No available sessions on this date</p>
        )}
      </>
    );
  }

  const schedules = isTrainer && (
    <>
      <h2 className="text-xl">Schedules</h2>
      <div className="flex">
        <ul className="list-disc list-inside basis-4/12">
          {userSchedules.map((schedule) => (
            <ExistingSchedule key={schedule.id} schedule={schedule} />
          ))}
        </ul>
        <div className="flex-1">
          <div className="flex flex-items justify-center gap-x-5 mb-3">
            <select
              className="block border text-sm rounded-lg w-1/4 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
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
              className="block border text-sm rounded-lg w-1/4 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
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
              className={`text-black focus:ring-4 focus:outline-none rounded-md w-1/4 text-sm px-5 py-1 text-center ${
                newScheduleTimeOfDay === "" || newScheduleDayOfWeek === -1
                  ? "bg-gray-500"
                  : "bg-secondary hover:bg-accent"
              }`}
              disabled={
                newScheduleTimeOfDay === "" || newScheduleDayOfWeek === -1
              }
              onClick={createNewSchedule}
            >
              Create schedule
            </button>
          </div>
        </div>
      </div>
      <hr className="mt-2 pb-2" />
    </>
  );

  return (
    <div className="mx-auto max-w-6xl pt-5">
      {schedules}
      {mySessions.length > 0 && (
        <div className="pb-3 border-b-1 border-white">
          <h2 className="text-xl">Pending sessions</h2>
          {mySessions.map((session) => (
            <PendingSession key={session.id} cidMap={cidMap} {...session} />
          ))}
        </div>
      )}

      <div className="flex justify-between items-start space-x-10">
        <div className="text-black flex-none">
          <Calendar
            onChange={(val) => selectDay(val)}
            value={selectedDate}
            minDate={new Date()}
            minDetail="year"
            view="month"
            locale="en-US"
            prev2Label={null}
            next2Label={null}
          />
        </div>
        <div className="flex-1">{sessionsBody}</div>
      </div>
    </div>
  );
}
