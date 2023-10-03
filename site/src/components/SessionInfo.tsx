import type { CidMap } from "../pages/api/cid_map";
import type { TrainerRatingMap } from "../pages/api/ratings_map";

export type SessionInfoProps = {
  id: number;
  scheduleId: number | null;
  instructor: number;
  date: string;
  time: number;
  status: string;
  cidMap: CidMap;
  ratingMap: TrainerRatingMap;
};

function trainerName(cid: number, map: CidMap): string {
  const e = map[cid];
  return `${e?.first_name} ${e?.last_name} (${e?.operating_initials})`;
}

function ratingNames(cid: number, map: TrainerRatingMap): string {
  const e = map[cid];
  const ratings: Array<string> = [];
  if (e?.minorGround) {
    ratings.push("Minor Ground");
  }
  if (e?.majorGround) {
    ratings.push("Major Ground");
  }
  if (e?.minorTower) {
    ratings.push("Minor Tower");
  }
  if (e?.majorTower) {
    ratings.push("Major Tower");
  }
  if (e?.minorApproach) {
    ratings.push("Minor Approach");
  }
  if (e?.majorApproach) {
    ratings.push("Major Approach");
  }
  if (e?.center) {
    ratings.push("Center");
  }
  if (ratings.length > 0) {
    return ratings.join(", ");
  }
  return "None";
}

export function SessionInfo(props: SessionInfoProps) {
  const time = props.time.toString().padStart(4, "0");
  return (
    <button className="block p-3 mb-1 w-full max-w-3xl border rounded-lg shadow bg-gray-800 border-gray-700 hover:bg-gray-700">
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-white">
        {time.toString().substring(0, 2)}:{time.toString().substring(2)}
      </h5>
      <div className="font-normal text-gray-400">
        <p>
          <span className="font-bold">Trainer</span>:{" "}
          {trainerName(props.instructor, props.cidMap)}
        </p>
        <p>
          <span className="font-bold">Positions</span>:{" "}
          {ratingNames(props.instructor, props.ratingMap)}
        </p>
      </div>
    </button>
  );
}
