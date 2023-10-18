import type {
  TrainingSchedule,
  TrainingScheduleException,
} from "@prisma/client";
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

export function ExistingSchedule(props: {
  schedule: TrainingSchedule & {
    trainingScheduleException: Array<TrainingScheduleException>;
  };
  updateTrigger: () => void;
}) {
  const [showExclusionsModal, setShowExclusionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteSchedule = async (): Promise<void> => {
    try {
      await callEndpoint(`/api/schedules/${props.schedule.id}`, {
        method: "DELETE",
      });
      setShowDeleteModal(false);
      props.updateTrigger();
    } catch (err) {
      console.error(`Could not delete schedule: ${err}`);
      sendAlert("ERROR", "Could not delete schedule");
    }
  };

  return (
    <li>
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-30 ${
          showDeleteModal ? "" : "hidden"
        }`}
        onClick={() => setShowDeleteModal(false)}
      >
        <div
          className="relative top-20 mx-auto py-5 px-12 border w-1/4 shadow-lg rounded-xl z-40"
          style={{ backgroundColor: "#3a4a6b" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-2xl mb-4 font-bold">
            Are you sure that you want to delete this schedule?
          </h3>
          <div className="flex justify-between pt-5">
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center bg-green-400 hover:bg-green-300"
              onClick={() => setShowDeleteModal(false)}
            >
              Do not delete
            </button>
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center bg-red-400 hover:bg-red-300"
              onClick={() => deleteSchedule()}
            >
              Delete schedule
            </button>
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-30 ${
          showExclusionsModal ? "" : "hidden"
        }`}
        onClick={() => setShowExclusionsModal(false)}
      >
        <div
          className="relative top-20 mx-auto py-5 px-12 border w-1/4 shadow-lg rounded-xl z-40"
          style={{ backgroundColor: "#3a4a6b" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-2xl mb-4 font-bold">Schedule Exclusions</h3>
          {props.schedule.trainingScheduleException.length === 0 ? (
            <p>No exclusions</p>
          ) : (
            <ul className="list-disc list-inside">
              {props.schedule.trainingScheduleException.map((excl) => (
                <li key={excl.id}>{excl.date}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {DAY_OF_WEEK[props.schedule.dayOfWeek.toString()]}s at{" "}
      {props.schedule.timeOfDay}
      <button
        className="focus:outline-none focus:ring-4 font-medium rounded-xl text-sm px-2 py-1 text-center mb-2 ml-2 text-yellow-500 hover:text-white hover:bg-yellow-700 focus:ring-yellow-900"
        onClick={() => {
          setShowExclusionsModal(true);
        }}
      >
        Show exclusions
      </button>
      <button
        className="focus:outline-none focus:ring-4 font-medium rounded-xl text-sm px-2 py-1 text-center mb-2 ml-2 text-red-500 hover:text-white hover:bg-red-700 focus:ring-red-900"
        onClick={() => {
          setShowDeleteModal(true);
        }}
      >
        Delete
      </button>
    </li>
  );
}
