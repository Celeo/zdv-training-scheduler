import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { Value } from "../util/calendarTypes.ts";
import type { TrainingSchedule, TrainingSession } from "@prisma/client";
import { SessionInfo } from "./SessionInfo.tsx";
import { dateToDateStr } from "../util/date.ts";
import type { CidMap } from "../pages/api/cid_map.ts";

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<Array<TrainingSchedule>>([]);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [mySessions, setMySessions] = useState<Array<TrainingSession>>([]);
  const [error, setError] = useState<string | null>(null);
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [ratingMap, setRatingMap] = useState<{}>({});

  const selectDay = (val: Value) => {
    setSelectedDate(val);
    fetchDayData(val as Date);
  };

  const fetchDayData = async (date: Date) => {
    setIsLoading(true);
    try {
      const d = dateToDateStr(date);
      const resp = await fetch(`/api/sessions?limit-to-open=true&date=${d}`, {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      const data = await resp.json();
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
      try {
        const resp = await fetch("/api/schedules", {
          headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await resp.json();
        setSchedules(data);
      } catch (err) {
        console.error(`Error getting schedules: ${err}`);
        setError("Could not get scheduled sessions");
      }
      try {
        const resp = await fetch("/api/sessions/mine", {
          headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await resp.json();
        setMySessions(data);
      } catch (err) {
        console.error(`Error getting my sessions: ${err}`);
        setError("Could not get your scheduled sessions");
      }
      try {
        const resp = await fetch("/api/cid_map", {
          headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await resp.json();
        setCidMap(data);
      } catch (err) {
        console.error(`Error getting CID mapping: ${err}`);
        setError("Could not look up CIDs");
      }
      try {
        const resp = await fetch("/api/ratings_map", {
          headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await resp.json();
        setRatingMap(data);
      } catch (err) {
        console.error(`Error getting ratings mapping: ${err}`);
        setError("Could not look up ratings");
      }
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
