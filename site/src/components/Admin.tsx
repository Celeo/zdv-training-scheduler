import { useEffect, useState } from "react";
import type { CidMap } from "../pages/api/cid_map";
import type {
  TrainerRatingEntry,
  TrainerRatingMap,
} from "../pages/api/ratings";
import { FRIENDLY_POSITION_NAME_MAP, type Positions } from "../util/constants";

function Row(props: {
  cidMap: CidMap;
  ratings: TrainerRatingMap;
  cid: number;
}): JSX.Element {
  const [ratings, setRatings] = useState<TrainerRatingEntry | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (props.ratings !== null) {
      setRatings(props.ratings[props.cid]!);
    }
  }, [props.ratings]);

  useEffect(() => {
    let delta = false;
    for (const k of Object.keys(ratings ?? {})) {
      const key = k as Positions;
      if ((ratings ?? {})[key] !== props.ratings[props.cid]![key]) {
        delta = true;
        break;
      }
    }
    setDirty(delta);
  }, [ratings]);

  const save = async (): Promise<void> => {
    try {
      const resp = await fetch("/api/ratings", {
        method: "PUT",
        body: JSON.stringify({
          cid: props.cid,
          ...ratings,
        }),
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      if (resp.status !== 200) {
        console.error(
          `Got status ${resp.status} from server for updating ${props.cid}`,
        );
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error(`Error updating ratings for ${props.cid}: ${err}`);
    }
  };

  const user = props.cidMap[props.cid];
  if (user === undefined) {
    return <></>;
  }
  return (
    <div>
      <p className="text-base pt-2">
        {user.first_name} {user.last_name} ({user.operating_initials})
      </p>
      <div className="flex flex-row justify-between text-sm">
        {ratings &&
          Object.keys(ratings).map((n) => {
            const name = n as Positions;
            return (
              <div key={name} className="flex items-center">
                <input
                  id={name}
                  type="checkbox"
                  checked={ratings[name]}
                  onChange={() =>
                    setRatings((r) =>
                      r === null ? null : { ...r, [name]: !r[name] },
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
                />
                <label htmlFor={name} className="ml-2 text-sm font-medium">
                  {FRIENDLY_POSITION_NAME_MAP[name]}
                </label>
              </div>
            );
          })}
        <button
          className={`text-black focus:ring-4 focus:outline-none rounded-2xl text-sm w-auto px-3 py-1 text-center ${
            dirty ? "bg-green-400 hover:bg-green-300" : "bg-gray-500"
          }`}
          disabled={!dirty}
          onClick={save}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function Admin() {
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [ratings, setRatings] = useState<TrainerRatingMap>([]);
  const [error, setError] = useState(false);

  // retrieve user and ratings info
  useEffect(() => {
    (async () => {
      await Promise.all(
        [
          { path: "/api/cid_map", f: setCidMap },
          { path: "/api/ratings", f: setRatings },
        ].map(async ({ path, f }) => {
          try {
            const resp = await fetch(path, {
              headers: {
                authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
            });
            const data = await resp.json();
            f(data);
          } catch (err) {
            console.error(`Could not get data from server: ${err}`);
            setError(true);
            return;
          }
        }),
      );
      setError(false);
    })();
    // no args - called only on mount
  }, []);

  return (
    <div className="mx-auto max-w-6xl pt-5">
      <h2 className="text-2xl pb-3">Training ratings management</h2>
      {Object.keys(ratings).map((cid) => (
        <Row key={cid} cidMap={cidMap} ratings={ratings} cid={parseInt(cid)} />
      ))}
      {error && (
        <p>
          <span className="font-bold text-red-400">
            There was an error communicating with the server
          </span>
        </p>
      )}
    </div>
  );
}
