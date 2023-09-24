import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import type { Value } from "../util/calendarTypes.ts";
import "react-calendar/dist/Calendar.css";
import type { TrainingSchedule, TrainingSession } from "@prisma/client";

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
    const resp = await fetch(
      `/api/sessions?date=${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate()}`,
      {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      },
    );
    const data = await resp.json();
    setSessions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    (async () => {
      const resp = await fetch("/api/schedules", {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      const data = await resp.json();
      setSchedules(data);
    })();
  }, []);

  return (
    <div className="mx-auto pt-10">
      <div>{/* upcoming selected sessions */}</div>
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
        <div className="flex-1">
          {isLoading ? (
            <p className="italic text-lg text-gray-300">Loading ...</p>
          ) : (
            <>
              <h3 className="text-xl">Open sessions</h3>
              {sessions.map((session) => (
                <p>{JSON.stringify(session)}</p>
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
          )}
        </div>
      </div>
    </div>
  );
}
