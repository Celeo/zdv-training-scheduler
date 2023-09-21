import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import type { Value } from "../util/calendarTypes.ts";
import "react-calendar/dist/Calendar.css";
import type { TrainingSchedule, TrainingSession } from "@prisma/client";

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<Array<TrainingSchedule>>([]);
  const [sessions, setSessions] = useState<Array<TrainingSession>>([]);
  const [error, setError] = useState<string | null>(null);

  const selectDay = (val: Value) => {
    setSelectedDate(val);
    fetchDayData();
  };

  const fetchDayData = async () => {
    setIsLoading(true);
    //
    setIsLoading(false);
  };

  const chooseSession = async () => {
    //
  };

  const cancelSession = async () => {
    //
  };

  useEffect(() => {
    (async () => {
      await fetchDayData();
      const resp = await fetch("/api/schedules", {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      const data = await resp.json();
      setSchedules(data);
    })();
  }, []);

  return (
    <div className="mx-auto pt-10 flex justify-between items-start space-x-10">
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
          <h3 className="text-xl">Open sessions</h3>
        )}
      </div>
    </div>
  );
}
