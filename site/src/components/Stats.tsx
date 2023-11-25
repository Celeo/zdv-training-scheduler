import { useEffect, useState } from "react";
import { sendAlert } from "../data";
import type { CidMap } from "../pages/api/cid_map";
import type { Stat, Stats } from "../pages/api/stats";
import { callEndpoint } from "../util/http";
import { infoToName } from "../util/print";

type StatsWithName = Array<Stat & { name: string }>;

export function Stats() {
  const [stats, setStats] = useState<StatsWithName>([]);

  useEffect(() => {
    (async () => {
      const cidMapRaw: CidMap | undefined = await callEndpoint("/api/cid_map", {
        returnData: true,
      });
      if (cidMapRaw === undefined) {
        sendAlert("ERROR", "Could not load stats");
        return;
      }
      const statsRaw: Stats | undefined = await callEndpoint("/api/stats", {
        returnData: true,
      });
      if (statsRaw === undefined) {
        sendAlert("ERROR", "Could not load stats");
        return;
      }
      setStats(
        statsRaw.map((s) => ({ ...s, name: infoToName(cidMapRaw[s.cid]!) })),
      );
    })();
  }, []);

  if (stats.length === 0) {
    return <p className="text-gray-300 text-xl pl-40">Loading ratings ...</p>;
  }

  return (
    <div className="pt-5 max-w-3xl lg:max-w-5xl mx-auto">
      <h2 className="text-2xl pb-5">Stats</h2>
      <table className="table-auto border-collapse border border-slate-500 w-full text-lg">
        <thead className="text-xl">
          <tr className="text-left">
            <th className="pl-2">Trainer</th>
            <th className="pl-2">Schedules</th>
            <th className="pl-2">Sessions past</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr
              key={s.cid}
              className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700"
            >
              <td className="pl-5">{s.name}</td>
              <td className="pl-5">
                {s.schedules} ({s.exclusions} exclusions)
              </td>
              <td className="pl-5">{s.sessionsPast}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
