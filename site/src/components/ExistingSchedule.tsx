import type { TrainingSchedule } from "@prisma/client";
import { useState } from "react";
import { sendAlert } from "../data";
import { callEndpoint } from "../util/http";

const DAY_OF_WEEK: Record<string, string> = {
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
  "7": "Sunday",
};

export function ExistingSchedule(props: { schedule: TrainingSchedule }) {
  const [showModal, setShowModal] = useState(false);

  const cancelReservation = async (): Promise<void> => {
    try {
      await callEndpoint(`/api/schedules/${props.schedule.id}`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch (err) {
      console.error(`Could not delete schedule: ${err}`);
      sendAlert("ERROR", "Could not delete schedule");
    }
  };

  return (
    <li>
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-30 ${
          showModal ? "" : "hidden"
        }`}
        onClick={() => setShowModal(false)}
      >
        <div
          className="relative top-20 mx-auto py-5 px-12 border w-1/4 shadow-lg rounded-md z-40"
          style={{ backgroundColor: "#3a4a6b" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-2xl mb-4 font-bold">
            Are you sure that you want to delete this schedule?
          </h3>
          <div className="flex justify-between pt-5">
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-sm text-sm w-auto px-5 py-2.5 text-center bg-green-400 hover:bg-green-300"
              onClick={() => setShowModal(false)}
            >
              Do not delete
            </button>
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-sm text-sm w-auto px-5 py-2.5 text-center bg-red-400 hover:bg-red-300"
              onClick={() => cancelReservation()}
            >
              Delete schedule
            </button>
          </div>
        </div>
      </div>
      {DAY_OF_WEEK[props.schedule.dayOfWeek.toString()]}s at{" "}
      {props.schedule.timeOfDay}
      <button
        className="focus:outline-none focus:ring-4 font-medium rounded-full text-sm px-2 py-1 text-center mb-2 ml-2 text-red-500 hover:text-white hover:bg-red-700 focus:ring-red-900"
        onClick={() => {
          setShowModal(true);
        }}
      >
        Cancel
      </button>
    </li>
  );
}