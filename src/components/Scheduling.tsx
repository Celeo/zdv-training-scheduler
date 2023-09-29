import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { Value } from "../util/calendarTypes.ts";
import type { TrainingSchedule, TrainingSession } from "@prisma/client";
import { SessionInfo } from "./SessionInfo.tsx";

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<Array<TrainingSchedule>>([]);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [error, setError] = useState<string | null>(null);

  const selectDay = (val: Value) => {
    setSelectedDate(val);
    fetchDayData(val as Date);
  };

  const fetchDayData = async (date: Date) => {
    setIsLoading(true);
    try {
      const d = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate()}`;
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

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch("/api/schedules", {
          headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await resp.json();
        setSchedules(data);
        setError(null);
      } catch (err) {
        console.error(`Error getting schedules: ${err}`);
        setError("Could not get scheduled sesssions");
      }
    })();
  }, []);

  let body;
  if (isLoading) {
    body = <p className="italic text-lg text-gray-300">Loading ...</p>;
  } else if (selectedDate === null) {
    body = <p>Select a date on the calendar</p>;
  } else {
    body = (
      <>
        <h3 className="text-xl">Open sessions</h3>
        {sessions.map((session) => (
          <p>
            <SessionInfo {...session} />
          </p>
        ))}
        <h3 className="text-xl pt-5">Sessions from schedules</h3>
        {schedules
          .filter(
            (schedule) =>
              schedule.dayOfWeek === (selectedDate as Date).getDay(),
          )
          .map((schedule) => (
            <p>{JSON.stringify(schedule)}</p>
          ))}
      </>
    );
  }

  return (
    <div className="mx-auto pt-10">
      <div>{/* selected sessions */}</div>
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
