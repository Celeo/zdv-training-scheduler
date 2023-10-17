import { useState } from "react";
import type { CidMap } from "../pages/api/cid_map.ts";
import { infoToName } from "../util/auth.ts";
import {
  FRIENDLY_POSITION_NAME_MAP,
  type Positions,
} from "../util/constants.ts";
import { callEndpoint } from "../util/http.ts";

export type PendingSessionProps = {
  id: number;
  scheduleId: number | null;
  instructor: number;
  date: string;
  time: string;
  notes: string;
  selectedPosition: string | null;
  cidMap: CidMap;
};

export function PendingSession(props: PendingSessionProps) {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(false);

  const cancelReservation = async (): Promise<void> => {
    try {
      await callEndpoint(`/api/sessions/${props.id}`, {
        method: "PUT",
        body: { action: "UNACCEPT" },
      });
      window.location.reload();
    } catch (err) {
      console.error(`Could not cancel reservation: ${err}`);
      setError(true);
    }
  };

  const instructor = props.cidMap[props.instructor];
  return (
    <>
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
            Are you sure that you want to cancel your reservation?
          </h3>
          <div className="flex justify-between pt-5">
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-sm text-sm w-auto px-5 py-2.5 text-center bg-green-400 hover:bg-green-300"
              onClick={() => setShowModal(false)}
            >
              Do not cancel
            </button>
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-sm text-sm w-auto px-5 py-2.5 text-center bg-red-400 hover:bg-red-300"
              onClick={() => cancelReservation()}
            >
              Cancel reservation
            </button>
          </div>
          {error && (
            <p>
              <span className="font-bold text-red-500">
                There was an error communicating with the server
              </span>
            </p>
          )}
        </div>
      </div>
      <ul className="list-disc list-inside text-base">
        <li className="text-blue-200">
          {props.date} at {props.time} with {infoToName(instructor!)} for{" "}
          {FRIENDLY_POSITION_NAME_MAP[props.selectedPosition! as Positions]}
          {props.notes}
          <button
            className="focus:outline-none focus:ring-4 font-medium rounded-full text-sm px-2 py-1 text-center mb-2 ml-2 text-red-500 hover:text-white hover:bg-red-700 focus:ring-red-900"
            onClick={() => {
              setShowModal(true);
            }}
          >
            Cancel
          </button>
        </li>
      </ul>
    </>
  );
}
