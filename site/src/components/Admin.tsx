import { useEffect, useState } from "react";
import { sendAlert } from "../data";
import type { CidMap } from "../pages/api/cid_map";
import type {
  TrainerRatingMap,
  TrainerRatingMapEntry,
} from "../pages/api/ratings";
import { callEndpoint } from "../util/http";
import { infoToName } from "../util/print";

function Row(props: {
  cidMap: CidMap;
  ratings: TrainerRatingMapEntry;
  cid: number;
  toggle: (cid: number, position: string) => void;
}): JSX.Element {
  return (
    <div className="flex justify-between mt-1">
      <p className="pt-2">{infoToName(props.cidMap[props.cid]!)}</p>
      <div className="flex justify-center text-sm">
        {Object.keys(props.ratings).map((name) => {
          return (
            <button
              key={name}
              className={`px-3 py-2 mx-0.5 rounded-none border-0 ${
                props.ratings[name]!.rated
                  ? "border-green-200 bg-green-400 bg-opacity-50 hover:bg-opacity-90 text-white"
                  : "border-white bg-white bg-opacity-60 hover:bg-opacity-90 text-black"
              }`}
              onClick={() => props.toggle(props.cid, name)}
            >
              {props.ratings[name]!.friendly}
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
      const r: Record<string, boolean> = {};
      Object.entries(ratings[cid] ?? {}).forEach(([key, value]) => {
        r[key] = value.rated;
      });
      await callEndpoint("/api/ratings", {
        method: "PUT",
        body: { cid, ratings: r },
      });
    }
    sendAlert("INFO", "Ratings saved");
    await getRatings();
  };

  const syncRoster = async (): Promise<void> => {
    try {
      await callEndpoint("/api/ratings/sync", { method: "POST" });
      sendAlert("INFO", "Roster synchronized");
      await getRatings();
    } catch (err) {
      console.error(`Error syncing roster: ${err}`);
      sendAlert("ERROR", "Could not sync roster");
    }
  };

  useEffect(() => {
    setDirty(JSON.stringify(ratings) !== JSON.stringify(serverRatings));
  }, [ratings]);

  useEffect(() => {
    getCidMap();
    getRatings();
  }, []);

  return (
    <div className="pt-5 max-w-3xl mx-auto" style={{ maxWidth: "110rem" }}>
      <div className="flex justify-between pb-5">
        <h2 className="text-2xl">Training ratings management</h2>
        <button
          className="text-black focus:ring-4 focus:outline-none rounded-xl text-sm px-5 py-2 text-center bg-green-400 hover:bg-green-300"
          onClick={syncRoster}
        >
          Sync
        </button>
      </div>
      {Object.keys(cidMap).length > 0 && (
        <>
          {Object.keys(ratings).map((cid) => (
            <Row
              key={cid}
              cidMap={cidMap}
              ratings={ratings[parseInt(cid)]!}
              cid={parseInt(cid)}
              toggle={(cid, position) => {
                setRatings((r) => {
                  return {
                    ...r,
                    [cid]: {
                      ...r[cid]!,
                      [position]: {
                        friendly: r[cid]![position]!.friendly,
                        rated: !r[cid]![position]!.rated,
                      },
                    },
                  };
                });
              }}
            />
          ))}
          <div className="flex flex-center pt-10">
            <button
              className={`mx-auto w-6/12 text-black focus:ring-4 focus:outline-none rounded-xl text-sm px-5 py-2.5 text-center ${
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
