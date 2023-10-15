import { useStore } from "@nanostores/react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import type { Alert } from "../data";
import { alertStore } from "../data.ts";

type UiAlert = Alert & { uuid: string };

export function Alerts() {
  const [localAlerts, setLocalAlerts] = useState<Array<UiAlert>>([]);
  const globalAlerts = useStore(alertStore);

  useEffect(() => {
    if (globalAlerts.length > 0) {
      const newAlerts = globalAlerts.map((a2) => ({ ...a2, uuid: nanoid() }));
      newAlerts.forEach(({ uuid }) =>
        setTimeout(() => {
          setLocalAlerts((alerts) => alerts.filter((a) => a.uuid !== uuid));
        }, 10_000),
      );
      setLocalAlerts((a) => [...a, ...newAlerts]);
      alertStore.set([]);
    }
  }, [globalAlerts]);

  const close = (uuid: string): void => {
    setLocalAlerts((alerts) => alerts.filter((a) => a.uuid !== uuid));
  };

  return (
    <div className="absolute top-5 right-5">
      {localAlerts.map(({ level, message, uuid }) => {
        let icon;
        if (level === "INFO") {
          icon = (
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-green-800 text-green-200">
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
              </svg>
              <span className="sr-only">Check icon</span>
            </div>
          );
        } else if (level === "WARN") {
          icon = (
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-orange-700 text-orange-200">
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
              </svg>
              <span className="sr-only">Warning icon</span>
            </div>
          );
        } else {
          icon = (
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-red-800 text-red-200">
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
              </svg>
              <span className="sr-only">Error icon</span>
            </div>
          );
        }

        return (
          <div key={uuid} className="custom-fade-in">
            <div
              className="flex items-center w-full max-w-xs p-4 mb-2 rounded-lg shadow text-gray-400 bg-gray-600"
              role="alert"
            >
              {icon}
              <div className="ml-3 text-sm font-normal">{message}</div>
              <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8 text-gray-500 hover:text-white bg-gray-600 hover:bg-gray-700"
                aria-label="Close"
                onClick={() => close(uuid)}
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
