import type { DateTime } from "luxon";
import { useState } from "react";
import { sendAlert } from "../data.ts";
import type { CidMap } from "../pages/api/cid_map.ts";
import {
  FRIENDLY_POSITION_NAME_MAP,
  type Positions,
} from "../util/constants.ts";
import { callEndpoint } from "../util/http.ts";
import { DateDisplayTypes, dateToStr, infoToName } from "../util/print.ts";

export type PendingSessionProps = {
  session: {
    id: number;
    scheduleId: number | null;
    trainer: number;
    dateTime: DateTime;
    notes: string;
    position: string | null;
  };

  cidMap: CidMap;
  updateTrigger: () => void;
};

export function PendingSession(props: PendingSessionProps) {
  const [showModal, setShowModal] = useState(false);

  const cancelReservation = async (): Promise<void> => {
    try {
      await callEndpoint(`/api/sessions/${props.session.id}`, {
        method: "PUT",
        body: { action: "UNACCEPT" },
      });
      props.updateTrigger();
    } catch (err) {
      console.error(`Could not cancel reservation: ${err}`);
      sendAlert("ERROR", "Could not cancel reservation");
    }
  };

  const trainer = props.cidMap[props.session.trainer];
  if (trainer === undefined) {
    return <></>;
  }
  return (
    <>
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-30 ${
          showModal ? "" : "hidden"
        }`}
        onClick={() => setShowModal(false)}
      >
        <div
          className="relative top-20 mx-auto py-5 px-12 border w-1/4 shadow-lg rounded-xl z-40"
          style={{ backgroundColor: "#3a4a6b" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-2xl mb-4 font-bold">
            Are you sure that you want to cancel your reservation?
          </h3>
          <div className="flex justify-between pt-5">
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center bg-green-400 hover:bg-green-300"
              onClick={() => setShowModal(false)}
            >
              Do not cancel
            </button>
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center bg-red-400 hover:bg-red-300"
              onClick={() => cancelReservation()}
            >
              Cancel reservation
            </button>
          </div>
        </div>
      </div>
      <ul className="list-disc list-inside text-base">
        <li className="text-sky-200">
          {dateToStr(props.session.dateTime, DateDisplayTypes.DateAndTime)} with{" "}
          {infoToName(trainer!)} for{" "}
          {FRIENDLY_POSITION_NAME_MAP[props.session.position! as Positions]}
          {props.session.notes}
          <button
            className="focus:outline-none focus:ring-4 font-medium rounded-xl text-sm px-2 py-1 text-center mb-0 ml-2 text-red-500 hover:text-white hover:bg-red-700 focus:ring-red-900"
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
