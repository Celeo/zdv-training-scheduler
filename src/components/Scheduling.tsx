import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type Range<T> = [T, T];
type ValuePiece = Date | null;
type Value = ValuePiece | Range<ValuePiece>;
type View = "century" | "decade" | "year" | "month";
type TileArgs = {
  activeStartDate: Date;
  date: Date;
  view: View;
};

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
