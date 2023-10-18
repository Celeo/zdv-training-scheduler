import * as jose from "jose";
import { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css";
import type { JwtPayload } from "../util/auth.js";
import { TRAINER_ROLES } from "../util/constants.js";
import { SchedulingStudent } from "./SchedulingStudent.js";
import { SchedulingTrainer } from "./SchedulingTrainer.js";

const inactiveTab =
  "inline-block pb-4 px-10 cursor-pointer border-b-2 border-transparent rounded-t-lg hover:border-gray-300 hover:text-gray-300";
const activeTab =
  "inline-block pb-4 px-10 cursor-pointer border-b-2 rounded-t-lg active text-blue-500 border-blue-500";

export function Scheduling() {
  const [selectedTab, setSelectedTab] = useState(1);
  const [isTrainer, setIsTrainer] = useState(false);
  const [currentUserCid, setCurrentUserCid] = useState(-1);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const claims = jose.decodeJwt(jwt) as JwtPayload;
      const success =
        claims.info.roles.includes("wm") ||
        claims.info.roles.some((r) => TRAINER_ROLES.includes(r));
      setCurrentUserCid(claims.info.cid);
      setIsTrainer(success);
    }
  });

  if (!isTrainer) {
    return (
      <div className="mx-auto max-w-6xl pt-5">
        <SchedulingStudent currentUserCid={currentUserCid} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pt-5">
      <div className="text-sm font-medium text-center border-b text-gray-400 border-gray-700 mb-5">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setSelectedTab(1)}
              className={`${selectedTab === 1 ? activeTab : inactiveTab}`}
            >
              Student
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setSelectedTab(2)}
              className={`${selectedTab === 2 ? activeTab : inactiveTab}`}
              aria-current="page"
            >
              Trainer
            </button>
          </li>
        </ul>
      </div>

      <div className={`${selectedTab === 1 ? "" : "hidden"}`}>
        <SchedulingStudent currentUserCid={currentUserCid} />
      </div>
      <div className={`${selectedTab === 2 ? "" : "hidden"}`}>
        <SchedulingTrainer />
      </div>
    </div>
  );
}
