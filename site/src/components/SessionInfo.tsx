import { useState } from "react";
import type { CidMap } from "../pages/api/cid_map";
import type { TrainerRatingMap } from "../pages/api/ratings_map";

export type SessionInfoProps = {
  id: number;
  scheduleId: number | null;
  instructor: number;
  date: string;
  time: string;
  status: string;
  cidMap: CidMap;
  ratingMap: TrainerRatingMap;
  notes: string;
};

function trainerName(cid: number, map: CidMap): string {
  const e = map[cid];
  return `${e?.first_name} ${e?.last_name} (${e?.operating_initials})`;
}

function ratings(cid: number, map: TrainerRatingMap): Array<[string, string]> {
  const e = map[cid];
  const ratings: Array<[string, string]> = [];
  if (e?.minorGround) {
    ratings.push(["minorGround", "Minor Ground"]);
  }
  if (e?.majorGround) {
    ratings.push(["majorGround", "Major Ground"]);
  }
  if (e?.minorTower) {
    ratings.push(["minorTower", "Minor Tower"]);
  }
  if (e?.majorTower) {
    ratings.push(["majorTower", "Major Tower"]);
  }
  if (e?.minorApproach) {
    ratings.push(["minorApproach", "Minor Approach"]);
  }
  if (e?.majorApproach) {
    ratings.push(["majorApproach", "Major Approach"]);
  }
  if (e?.center) {
    ratings.push(["center", "Center"]);
  }
  return ratings;
}

function ratingsToPrintout(ratings: Array<[string, string]>): string {
  if (ratings.length === 0) {
    return "None";
  }
  if (ratings.length === 7) {
    return "All";
  }
  return ratings.map((pair) => pair[1]).join(", ");
}

export function SessionInfo(props: SessionInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");

  const close = (): void => {
    setIsOpen(false);
    setSelectedPosition("");
  };

  const confirm = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const resp = await fetch(`/api/sessions/${props.id}`, {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
        method: "PUT",
        body: JSON.stringify({
          action: "ACCEPT",
          scheduleId: props.scheduleId,
        }),
      });
      const text = await resp.text();
      if (resp.status === 200 && text === "Accepted") {
        window.location.reload();
      } else {
        setResponse("");
      }
    } catch (err) {
      console.error(`Error confirming session: ${err}`);
      setResponse("There was an error confirming your session");
    }
  };

  const dropdownOptions = isOpen
    ? ratings(props.instructor, props.ratingMap).map(([key, value]) => (
        <option key={key} value={key}>
          {value}
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
          className="relative top-20 mx-auto py-5 px-12 border w-4/12 shadow-lg rounded-md z-40"
          style={{ backgroundColor: "#3a4a6b" }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h3 className="text-2xl mb-4 font-bold">Confirm registration</h3>
          <p>
            <span className="font-bold">Time</span>: {props.time}
          </p>
          <p>
            <span className="font-bold">Trainer</span>:{" "}
            {trainerName(props.instructor, props.cidMap)}
          </p>
          {props.notes && (
            <p>
              <strong>Notes</strong>: {props.notes}
            </p>
          )}
          <label htmlFor="position" className="block mb-1">
            <span className="font-bold">Training position</span>:
          </label>
          <select
            name="position"
            id="position"
            className="block border text-sm rounded-lg w-1/3 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
            onChange={(e) => {
              setSelectedPosition(e.target.value);
            }}
            value={selectedPosition}
          >
            <option value="" disabled></option>
            {dropdownOptions}
          </select>
          <div className="flex justify-between pt-5">
            <button
              className={`text-black focus:ring-4 focus:outline-none rounded-sm text-sm w-auto px-5 py-2.5 text-center ${
                selectedPosition === "" || isLoading || response !== ""
                  ? "bg-gray-500"
                  : "bg-green-400 hover:bg-green-300"
              }`}
              disabled={selectedPosition === ""}
              onClick={() => confirm()}
            >
              Confirm
            </button>
            <button
              className="text-black focus:ring-4 focus:outline-none rounded-sm text-sm w-auto px-5 py-2.5 text-center bg-red-400 hover:bg-red-300"
              onClick={() => close()}
            >
              Cancel
            </button>
          </div>
          {response && (
            <p>
              <span className="font-bold">Response from the server</span>:{" "}
              {response}
            </p>
          )}
        </div>
      </div>
      <button
        className="block p-3 mb-1 w-full max-w-3xl border rounded-lg shadow bg-gray-800 border-gray-700 hover:bg-gray-700"
        onClick={() => setIsOpen(true)}
      >
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-white">
          {props.time}
        </h5>
        <div className="font-normal text-gray-400">
          <p>
            <span className="font-bold">Trainer</span>:{" "}
            {trainerName(props.instructor, props.cidMap)}
          </p>
          <p>
            <span className="font-bold">Positions</span>:{" "}
            {ratingsToPrintout(ratings(props.instructor, props.ratingMap))}
          </p>
          {props.notes && (
            <p>
              <strong>Notes</strong>: {props.notes}
            </p>
          )}
        </div>
      </button>
    </>
  );
}
