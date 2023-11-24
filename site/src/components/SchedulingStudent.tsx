import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { sendAlert } from "../data.ts";
import type { CidMap } from "../pages/api/cid_map.ts";
import { callEndpoint } from "../util/http.ts";
import type { TrainingSession_DT, Value } from "../util/types.ts";
import { AvailableSession } from "./AvailableSession.tsx";
import { PendingSession } from "./PendingSession.tsx";

export function SchedulingStudent(props: { currentUserCid: number }) {
  const [selectedDate, setSelectedDate] = useState<Value>(null);
  const [sessions, setSessions] = useState<Array<TrainingSession_DT>>([]);
  const [mySessions, setMySessions] = useState<Array<TrainingSession_DT>>([]);
  const [cidMap, setCidMap] = useState<CidMap>({});
  const [positions, setPositions] = useState<Array<[string, string]>>([]);
  const [ratingMap, setRatingMap] = useState<{}>({});

  useEffect(() => {
    (async () => {
      await Promise.all([
        callEndpoint("/api/sessions/mine?pending=true", {
          setHook: setMySessions,
        }),
        callEndpoint("/api/cid_map", { setHook: setCidMap }),
        callEndpoint("/api/ratings", { setHook: setRatingMap }),
        callEndpoint("/api/positions", { setHook: setPositions }),
      ]);
    })();
  }, []);

  /**
   * Called when the user selects a date on the calendar.
   */
  const selectDay = async (val: Value): Promise<void> => {
    setSelectedDate(val);
    const date = val as Date;
    try {
      const ds = DateTime.fromJSDate(date).setZone("utc").toISODate();
      await callEndpoint(`/api/sessions?date=${ds}`, { setHook: setSessions });
    } catch (err) {
      console.error(`Error getting sessions for ${date}: ${err}`);
      sendAlert("ERROR", "Could not get sessions");
    }
  };

  return (
    <>
      {mySessions.length > 0 && (
        <div className="pb-3 border-b-1 border-white">
          <h2 className="text-xl">Pending sessions</h2>
          {mySessions.map((session) => (
            <PendingSession
              key={session.id}
              session={session}
              positions={positions}
              cidMap={cidMap}
              updateTrigger={() =>
                callEndpoint("/api/sessions/mine?pending=true", {
                  setHook: setMySessions,
                })
              }
            />
          ))}
        </div>
      )}
      <div className="flex justify-between items-start space-x-10">
        <div className="text-black flex-none">
          <Calendar
            onChange={(val) => selectDay(val)}
            value={selectedDate}
            minDate={new Date()}
            minDetail="year"
            view="month"
            locale="en-US"
            prev2Label={null}
            next2Label={null}
          />
        </div>
        <div className="flex-1">
          {selectedDate === null ? (
            <h3 className="text-xl">Select a date on the calendar</h3>
          ) : (
            <>
              <h3 className="text-xl pb-2">Open sessions</h3>
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <AvailableSession
                    key={session.id}
                    session={session}
                    positions={positions}
                    cidMap={cidMap}
                    ratingMap={ratingMap}
                    pendingSessions={mySessions.length}
                    currentUserCid={props.currentUserCid}
                    updateTrigger={() => {
                      Promise.all([
                        selectDay(selectedDate),
                        callEndpoint("/api/sessions/mine?pending=true", {
                          setHook: setMySessions,
                        }),
                      ]);
                    }}
                  />
                ))
              ) : (
                <p className="text-md">No available sessions on this date</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
