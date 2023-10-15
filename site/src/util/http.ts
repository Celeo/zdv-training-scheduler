/**
 * Make an authenticated call to the server endpoint.
 *
 * Automatically sets the "authorization" header from `localStorage`.
 */
export async function callEndpoint(
  path: string,
  args: {
    method?: string;
    body?: unknown;
    setHook?: React.Dispatch<React.SetStateAction<unknown>>;
    returnData?: boolean;
  },
): Promise<unknown | null> {
  const method = args.method ?? "GET";
  const body = args.body
    ? typeof args.body == "string"
      ? args.body
      : JSON.stringify(args.body)
    : null;

  try {
    const headers = new Headers();
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      headers.set("authorization", `Bearer ${jwt}`);
    }

    const resp = await fetch(path, { method, body, headers });
    if (!resp.ok) {
      const msg = `Got status ${resp.status} from ${method} request to ${path}`;
      console.error(msg);
      throw new Error(msg);
    }

    if (args.setHook !== undefined || args.returnData) {
      const data = await resp.json();
      if (args.setHook) {
        args.setHook(data);
      }
      if (args.returnData) {
        return data;
      }
    }

    return null;
  } catch (err) {
    const msg = `Could not send ${method} request${
      body ? " with body" : ""
    } to ${path}: ${err}`;
    console.error(msg);
    throw new Error(msg);
  }
}
