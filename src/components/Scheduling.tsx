import { useState } from "react";
import Calendar from "react-calendar";
import type { TileArgs, Value } from "../util/calendarTypes.ts";
import "react-calendar/dist/Calendar.css";

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

function tileDisabled(args: TileArgs): boolean {
  return args.date < yesterday;
}

export function Scheduling() {
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());

  return (
    <div className="mx-auto max-w-6xl">
      <div className="text-black">
        <Calendar
          onChange={(val) => setSelectedDate(val)}
          value={selectedDate}
          tileDisabled={tileDisabled}
        />
      </div>
    </div>
  );
}
