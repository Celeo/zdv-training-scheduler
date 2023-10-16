import { useEffect, useState } from "react";
import { sendAlert } from "../data";
import type { CidMap } from "../pages/api/cid_map";
import type {
  TrainerRatingEntry,
  TrainerRatingMap,
} from "../pages/api/ratings";
import { FRIENDLY_POSITION_NAME_MAP, type Positions } from "../util/constants";
import { callEndpoint } from "../util/http";

function Row(props: {
  cidMap: CidMap;
  ratings: TrainerRatingEntry;
  cid: number;
  toggle: (cid: number, position: Positions) => void;
}): JSX.Element {
  return (
    <div className="flex justify-between mt-1">
      <p className="pt-2">
        {props.cidMap[props.cid]!.first_name}{" "}
        {props.cidMap[props.cid]!.last_name} (
        {props.cidMap[props.cid]!.operating_initials})
      </p>
      <div className="flex justify-center text-sm">
        {Object.keys(props.ratings).map((n) => {
          const name = n as Positions;
          return (
            <button
              key={name}
              className={`px-3 py-2 mx-0.5 rounded-none border-0 ${
                props.ratings[name]
                  ? "border-green-200 bg-green-400 bg-opacity-50 hover:bg-opacity-90 text-white"
                  : "border-white bg-white bg-opacity-60 hover:bg-opacity-90 text-black"
              }`}
              onClick={() => props.toggle(props.cid, name)}
            >
              {FRIENDLY_POSITION_NAME_MAP[name]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Admin() {
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [ratings, setRatings] = useState<TrainerRatingMap>({});
  const [serverRatings, setServerRatings] = useState<TrainerRatingMap>({});
  const [dirty, setDirty] = useState(false);

  const getCidMap = async (): Promise<void> => {
    try {
      await callEndpoint("/api/cid_map", { setHook: setCidMap });
    } catch (err) {
      console.error(`Could not get CID mapping: ${err}`);
      sendAlert("ERROR", "Could not get CID mapping from the server");
    }
  };

  const getRatings = async (): Promise<void> => {
    try {
      const data = await callEndpoint<TrainerRatingMap>("/api/ratings", {
        returnData: true,
      });
      setRatings(data!);
      setServerRatings(data!);
    } catch (err) {
      sendAlert("ERROR", "Could not get ratings from the server");
      console.error(`Could not get ratings: ${err}`);
    }
  };

  const saveAll = async (): Promise<void> => {
    for (const cidStr of Object.keys(ratings)) {
      const cid = parseInt(cidStr);
      if (JSON.stringify(ratings[cid]) === JSON.stringify(serverRatings[cid])) {
        continue;
      }
      await callEndpoint("/api/ratings", {
        method: "PUT",
        body: { cid, ...ratings[cid] },
      });
    }
    sendAlert("INFO", "Ratings saved");
    getRatings();
  };

  useEffect(() => {
    setDirty(JSON.stringify(ratings) !== JSON.stringify(serverRatings));
  }, [ratings]);

  useEffect(() => {
    getCidMap();
    getRatings();
  }, []);

  return (
    <div className="mx-auto max-w-6xl pt-5">
      <h2 className="text-2xl pb-5">Training ratings management</h2>
      {Object.keys(cidMap).length > 0 && (
        <>
          {Object.keys(ratings).map((cid) => (
            <Row
              key={cid}
              cidMap={cidMap}
              ratings={ratings[parseInt(cid)]!}
              cid={parseInt(cid)}
              toggle={(cid, position) =>
                setRatings((r) => ({
                  ...r,
                  [cid]: {
                    ...r[cid]!,
                    [position]: !r[cid]![position],
                  },
                }))
              }
            />
          ))}
          <div className="flex flex-center pt-10">
            <button
              className={`mx-auto w-6/12 text-black focus:ring-4 focus:outline-none rounded-full text-sm px-5 py-2.5 text-center ${
                dirty ? "bg-green-400 hover:bg-green-300" : "bg-gray-500"
              }`}
              disabled={!dirty}
              onClick={saveAll}
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}
