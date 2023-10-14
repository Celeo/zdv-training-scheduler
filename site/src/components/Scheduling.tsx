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

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [mySessions, setMySessions] = useState<Array<TrainingSession>>([]);
  const [error, setError] = useState<string | null>(null);
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [ratingMap, setRatingMap] = useState<{}>({});
  const [isTrainer, setIsTrainer] = useState(false);

  // called when the user selects a date on the calendar
  const selectDay = async (val: Value) => {
    setSelectedDate(val);
    setIsLoading(true);
    const date = val as Date;
    try {
      const dt = DateTime.fromJSDate(date);
      const ds = `${dt.year}-${dt.month.toString().padStart(2, "0")}-${dt.day
        .toString()
        .padStart(2, "0")}`;
      const resp = await fetch(`/api/sessions?date=${ds}`, {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      const data: Array<TrainingSession> = await resp.json();
      setSessions(data);
      setError(null);
    } catch (err) {
      console.error(`Error getting sessions for ${date}: ${err}`);
      setError("Could not get sessions");
    }
    setIsLoading(false);
  };

  // retrieve schedules and the current user's pending sessions
  useEffect(() => {
    (async () => {
      await Promise.all(
        [
          { path: "/api/sessions/mine?pending=true", f: setMySessions },
          { path: "/api/cid_map", f: setCidMap },
          { path: "/api/ratings", f: setRatingMap },
        ].map(async ({ path, f }) => {
          try {
            const resp = await fetch(path, {
              headers: {
                authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
            });
            const data = await resp.json();
            f(data);
          } catch (err) {
            console.error(`Could not get data from server: ${err}`);
            setError("Could not get initial data from server");
            return;
          }
        }),
      );
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
  if (isLoading) {
    body = <p className="italic text-lg text-gray-300">Loading ...</p>;
  } else if (selectedDate === null) {
    body = <h3 className="text-xl">Select a date on the calendar</h3>;
  } else {
    body = (
      <>
        {isTrainer && (
          <div className="flex flex-items justify-center mb-3">
            {/* TODO time picker dropdown */}
            <button
              className="ml-5 text-black focus:ring-4 focus:outline-none rounded-md w-1/3 text-sm px-5 py-1 text-center bg-secondary hover:bg-accent"
              onClick={() => {}}
            >
              Create new
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
          <p>TODO</p>
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
