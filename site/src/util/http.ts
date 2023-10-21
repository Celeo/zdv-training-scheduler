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
      : JSON.stringify(args?.body)
    : null;

  try {
    const headers = new Headers();
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      headers.set("authorization", `Bearer ${jwt}`);
    }
    headers.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);

    const resp = await fetch(path, { method, body, headers });
    if (!resp.ok) {
      const msg = `Got status ${resp.status} from ${method} request to ${path}`;
      console.error(msg);
      throw new Error(msg);
    }

    if (args?.setHook !== undefined || args?.returnData) {
      const text = await resp.text();

      // thanks, JS no built-in JSON date deserializing
      const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      const data = JSON.parse(text, (_: any, value: any) => {
        if (typeof value === "string" && dateFormat.test(value)) {
          return new Date(value);
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
