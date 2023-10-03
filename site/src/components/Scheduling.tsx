import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { Value } from "../util/calendarTypes.ts";
import type { TrainingSchedule, TrainingSession } from "@prisma/client";
import { SessionInfo } from "./SessionInfo.tsx";
import { dateToDateStr } from "../util/date.ts";
import type { CidMap } from "../pages/api/cid_map.ts";
import { SESSION_STATUS } from "../util/contants.ts";

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<Array<TrainingSchedule>>([]);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [mySessions, setMySessions] = useState<Array<TrainingSession>>([]);
  const [error, setError] = useState<string | null>(null);
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [ratingMap, setRatingMap] = useState<{}>({});

  // called when the user selects a date on the calendar
  const selectDay = async (val: Value) => {
    setSelectedDate(val);
    setIsLoading(true);
    const date = val as Date;
    try {
      const d = dateToDateStr(date);
      const resp = await fetch(`/api/sessions?limit-to-open=true&date=${d}`, {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      const daySessions: Array<TrainingSession> = await resp.json();

      for (const schedule of schedules) {
        if (date.getDay() === schedule.dayOfWeek) {
          const alreadyAsSession =
            daySessions.find((s) => s.time === schedule.timeOfDay) !==
            undefined;
          if (alreadyAsSession) {
            continue;
          }
          daySessions.push({
            id: -1,
            scheduleId: schedule.id,
            instructor: schedule.instructor,
            student: null,
            selectedPosition: null,
            date: dateToDateStr(date),
            time: schedule.timeOfDay,
            status: SESSION_STATUS.OPEN,
            notes: "",
            createdAt: date,
            updatedAt: date,
          });
        }
      }

      setSessions(daySessions);
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
          { path: "/api/schedules", f: setSchedules },
          { path: "/api/sessions/mine", f: setMySessions },
          { path: "/api/cid_map", f: setCidMap },
          { path: "/api/ratings_map", f: setRatingMap },
        ].map(async ({ path, f }) => {
          const resp = await fetch(path, {
            headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
          });
          const data = await resp.json();
          f(data);
        }),
      );
    })();
  }, []);

  let body;
  if (isLoading) {
    body = <p className="italic text-lg text-gray-300">Loading ...</p>;
  } else if (selectedDate === null) {
    body = <h3 className="text-xl">Select a date on the calendar</h3>;
  } else {
    body = (
      <>
        <h3 className="text-xl pb-3">Open sessions</h3>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionInfo
              key={session.id}
              {...session}
              cidMap={cidMap}
              ratingMap={ratingMap}
            />
          ))
        ) : (
          <p className="text-md">No sessions available on this date</p>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto pt-10">
      {mySessions.length > 0 &&
        mySessions.map((s) => <p>{JSON.stringify(s)}</p>)}

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
