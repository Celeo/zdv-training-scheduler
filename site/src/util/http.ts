import { DateTime } from "luxon";

/**
 * Make an authenticated call to the server endpoint.
 *
 * Automatically sets the "authorization" header from `localStorage`.
 */
export async function callEndpoint<T = unknown>(
  path: string,
  args?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    setHook?: React.Dispatch<React.SetStateAction<any>>;
    returnData?: boolean;
  },
): Promise<T | undefined> {
  const method = args?.method ?? "GET";
  const body = args?.body
    ? typeof args?.body == "string"
      ? args?.body
      : JSON.stringify(args?.body, (_, value: unknown): any => {
          // transform luxon::DateTime objects to UTC, and then to a string
          if (value && typeof value === "object" && "fromISO" in value) {
            const dt = value as unknown as DateTime;
            return dt.setZone("utc").toISO();
          }
        })
    : null;

  try {
    const headers = new Headers();
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      headers.set("authorization", `Bearer ${jwt}`);
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    headers.set("timezone", timeZone);

    const resp = await fetch(path, { method, body, headers });
    if (!resp.ok) {
      const msg = `Got status ${resp.status} from ${method} request to ${path}`;
      console.error(msg);
      throw new Error(msg);
    }

    if (args?.setHook !== undefined || args?.returnData) {
      const text = await resp.text();

      const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      const data = JSON.parse(text, (_, value: any) => {
        if (typeof value === "string" && dateFormat.test(value)) {
          // parse the string to a luxon::DateTime object in UTC, then transform to the user's TZ
          return DateTime.fromISO(value, { zone: "utc" }).setZone(timeZone);
        }
        return value;
      });

      if (args?.setHook) {
        args?.setHook(data);
      }
      if (args?.returnData) {
        return data;
      }
    }

    return undefined;
  } catch (err) {
    const msg = `Could not send ${method} request${
      body ? " with body" : ""
    } to ${path}: ${err}`;
    console.error(msg);
    throw new Error(msg);
  }
}
