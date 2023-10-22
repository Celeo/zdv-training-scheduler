import { DateTime } from "luxon";
import { useState } from "react";
import { sendAlert } from "../data.ts";
import type { CidMap } from "../pages/api/cid_map.ts";
import type { TrainerRatingMap } from "../pages/api/ratings/index.ts";
import {
  FRIENDLY_POSITION_NAME_MAP,
  MAXIMUM_PENDING_SESSIONS,
  type Positions,
} from "../util/constants.ts";
import { callEndpoint } from "../util/http.ts";
import { DateDisplayTypes, dateToStr, infoToName } from "../util/print.ts";

export type AvailableSessionProps = {
  session: {
    id: number;
    scheduleId: number | null;
    trainer: number;
    dateTime: DateTime;
    status: string;
    notes: string;
  };

  cidMap: CidMap;
  ratingMap: TrainerRatingMap;

  pendingSessions: number;
  currentUserCid: number;

  updateTrigger: () => void;
};

function ratings(cid: number, map: TrainerRatingMap): Array<Positions> {
  const e = map[cid];
  const ratings = [];
  if (e?.minorGround) {
    ratings.push("minorGround");
  }
  if (e?.majorGround) {
    ratings.push("majorGround");
  }
  if (e?.minorTower) {
    ratings.push("minorTower");
  }
  if (e?.majorTower) {
    ratings.push("majorTower");
  }
  if (e?.minorApproach) {
    ratings.push("minorApproach");
  }
  if (e?.majorApproach) {
    ratings.push("majorApproach");
  }
  if (e?.center) {
    ratings.push("center");
  }
  return ratings as Array<Positions>;
}

function ratingsToPrintout(ratings: Array<Positions>): string {
  if (ratings.length === 0) {
    return "None";
  }
  if (ratings.length === 7) {
    return "All";
  }
  return ratings.map((pos) => FRIENDLY_POSITION_NAME_MAP[pos]).join(", ");
}

export function AvailableSession(props: AvailableSessionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const close = (): void => {
    setIsOpen(false);
    setPosition("");
  };

  const confirm = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await callEndpoint(`/api/sessions/${props.session.id}`, {
        method: "PUT",
        body: {
          action: "ACCEPT",
          scheduleId: props.session.scheduleId,
          position,
          date: props.session.dateTime.toISODate(),
        },
      });
      props.updateTrigger();
    } catch (err) {
      console.error(`Error confirming session: ${err}`);
      sendAlert("ERROR", "Error confirming session");
    }
  };

  const deleteSession = async (): Promise<void> => {
    try {
      await callEndpoint(`/api/sessions/${props.session.id}`, {
        method: "DELETE",
        body: {
          date: props.session.dateTime.toISODate(),
          scheduleId: props.session.scheduleId,
        },
      });
      props.updateTrigger();
    } catch (err) {
      console.error(`Error deleting session: ${err}`);
      sendAlert("ERROR", "Error deleting session");
    }
  };

  const dropdownOptions = isOpen
    ? ratings(props.session.trainer, props.ratingMap).map((pos) => (
        <option key={pos} value={pos}>
          {FRIENDLY_POSITION_NAME_MAP[pos]}
        </option>
      ))
    : [];

  return (
    <>
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-30 ${
          isOpen ? "" : "hidden"
        }`}
        onClick={() => close()}
      >
        <div
          className="relative top-20 mx-auto py-5 px-12 border w-3/12 shadow-lg rounded-xl z-40"
          style={{ backgroundColor: "#3a4a6b" }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h3 className="text-2xl mb-4 font-bold">Confirm registration</h3>
          <p>
            <span className="font-bold">Time</span>:{" "}
            {dateToStr(props.session.dateTime, DateDisplayTypes.Time)}
          </p>
          <p>
            <span className="font-bold">Trainer</span>:{" "}
            {infoToName(props.cidMap[props.session.trainer]!)}
          </p>
          {props.session.notes && (
            <p>
              <strong>Notes</strong>: {props.session.notes}
            </p>
          )}
          <label htmlFor="position" className="block mb-1">
            <span className="font-bold">Position</span>:
          </label>
          <select
            name="position"
            id="position"
            className="block border text-sm rounded-md w-1/2 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
            onChange={(e) => setPosition(e.target.value)}
            value={position}
          >
            <option value="" disabled></option>
            {dropdownOptions}
          </select>
          <div className="flex justify-between pt-5">
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center bg-red-400 hover:bg-red-300"
              onClick={close}
            >
              Cancel
            </button>

            {props.currentUserCid === props.session.trainer && (
              <button
                className="text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center bg-orange-400 hover:bg-orange-300"
                onClick={deleteSession}
              >
                Delete
              </button>
            )}

            <button
              className={`text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center ${
                position === "" ||
                isLoading ||
                props.pendingSessions >= MAXIMUM_PENDING_SESSIONS
                  ? "bg-gray-500"
                  : "bg-green-400 hover:bg-green-300"
              }`}
              disabled={
                position === "" ||
                props.pendingSessions >= MAXIMUM_PENDING_SESSIONS
              }
              onClick={confirm}
            >
              Confirm
            </button>
          </div>
          {props.pendingSessions >= MAXIMUM_PENDING_SESSIONS && (
            <p className="text-orange-500 pt-5">
              You have {props.pendingSessions} pending sessions and cannot
              accept any more at this time.
            </p>
          )}
        </div>
      </div>
      <div
        className="block p-3 mb-1 w-full cursor-pointer max-w-3xl border rounded-xl shadow bg-gray-800 border-gray-700 hover:bg-gray-700 text-center"
        onClick={() => setIsOpen(true)}
      >
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-white">
          {dateToStr(props.session.dateTime, DateDisplayTypes.Time)}
        </h5>
        <div className="font-normal text-gray-400">
          <p>
            <span className="font-bold">Trainer</span>:{" "}
            {infoToName(props.cidMap[props.session.trainer]!)}
          </p>
          <p>
            <span className="font-bold">Positions</span>:{" "}
            {ratingsToPrintout(ratings(props.session.trainer, props.ratingMap))}
          </p>
          {props.session.notes && (
            <p>
              <strong>Notes</strong>: {props.session.notes}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
