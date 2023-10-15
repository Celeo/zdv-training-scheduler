import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect, useState } from "react";
import type { Value } from "../util/calendarTypes.ts";
import type { TrainingSession } from "@prisma/client";
import { AvailableSession } from "./AvailableSession.tsx";
import type { CidMap } from "../pages/api/cid_map.ts";
import { DateTime } from "luxon";
import { PendingSession } from "./PendingSession.tsx";
import * as jose from "jose";
import type { JwtPayload } from "../util/auth.ts";
import { TRAINER_ROLES } from "../util/constants.ts";
import { callEndpoint } from "../util/http.ts";

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [mySessions, setMySessions] = useState<Array<TrainingSession>>([]);
  const [error, setError] = useState<string | null>(null);
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [ratingMap, setRatingMap] = useState<{}>({});
  const [isTrainer, setIsTrainer] = useState(false);
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionNotes, setNewSessionNotes] = useState("");

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
      setError("Could not get sessions");
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
      setError("Could not create session");
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
      setError(null);

      const jwt = localStorage.getItem("jwt");
      if (jwt) {
        const claims = jose.decodeJwt(jwt) as JwtPayload;
        setIsTrainer(
          claims.info.roles.includes("wm") ||
            claims.info.roles.some((r) => TRAINER_ROLES.includes(r)),
        );
      }
    })();
    // no args - called only on mount
  }, []);

  let body;
  if (selectedDate === null) {
    body = <h3 className="text-xl">Select a date on the calendar</h3>;
  } else {
    body = (
      <>
        {isTrainer && (
          <div className="flex flex-items justify-center gap-x-5 mb-3">
            <select
              name="time"
              id="time"
              className="block border text-sm rounded-lg w-1/4 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
              onChange={(e) => setNewSessionTime(e.target.value)}
              value={newSessionTime == null ? "" : newSessionTime.toString()}
            >
              <option value="" disabled></option>
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
              className="text-black focus:ring-4 focus:outline-none rounded-md w-1/4 text-sm px-5 py-1 text-center bg-secondary hover:bg-accent"
              onClick={createNewSession}
            >
              New session
            </button>
          </div>
        )}
        <h3 className="text-xl pb-2">Open sessions</h3>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <AvailableSession
              key={session.id}
              {...session}
              cidMap={cidMap}
              ratingMap={ratingMap}
            />
          ))
        ) : (
          <p className="text-md">No available sessions on this date</p>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pt-5">
      {isTrainer && (
        <>
          <h2 className="text-xl">Schedules</h2>
          {/* TODO */}
          <hr className="mt-5 pb-5" />
        </>
      )}

      {mySessions.length > 0 && (
        <div className="pb-5 border-b-1 border-white">
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
        <div className="flex-1">{body}</div>
      </div>

      {error && (
        <h2 className="text-2xl text-red-500 pt-3 text-center">{error}</h2>
      )}
    </div>
  );
}
