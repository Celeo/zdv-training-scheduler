import { useEffect, useState } from "react";
import { sendAlert } from "../data";
import { callEndpoint } from "../util/http";

type EndpointData = {
  receiveEmails: boolean;
  receiveDiscordMessages: boolean;
};

export function Preferences() {
  const [email, setEmail] = useState(false);
  const [discord, setDiscord] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const data = await callEndpoint<EndpointData>("/api/prefs", {
        returnData: true,
      });
      setEmail(data!.receiveEmails);
      setDiscord(data!.receiveDiscordMessages);
    })();
  }, []);

  const submit = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    event.preventDefault();
    try {
      await callEndpoint("/api/prefs", {
        method: "PUT",
        body: { email, discord },
      });
      sendAlert("INFO", "Preferences saved");
    } catch (err) {
      console.error(`Error saving preferences: ${err}`);
      setError(`could not save preferences`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl pb-8">Preferences</h2>
      <p>
        These notification preferences control where you will get notifications
        on:
      </p>
      <ul className="list-disc list-inside pb-4 -ml-2">
        <li>A student accepting your session</li>
        <li>A student un-accepting your session</li>
        <li>Your trainer cancelling your session</li>
      </ul>
      <form>
        <div className="mb-6">
          <fieldset>
            <div className="flex items-center">
              <input
                id="alertsEmail"
                type="checkbox"
                checked={email}
                onChange={() => setEmail(!email)}
                className="w-4 h-4 text-blue-600  rounded  ring-offset-gray-800 focus:ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
              />
              <label htmlFor="alertsEmail" className="ml-2 text-sm font-medium">
                Receive notifications over email
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                id="alertsDiscord"
                type="checkbox"
                checked={discord}
                onChange={() => setDiscord(!discord)}
                className="w-4 h-4 text-blue-600 rounded ring-offset-gray-800 focus:ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
              />
              <label
                htmlFor="alertsDiscord"
                className="ml-2 text-sm font-medium"
              >
                Receive notifications over Discord
              </label>
            </div>
          </fieldset>
        </div>
        <button
          type="submit"
          onClick={submit}
          className="text-black focus:ring-4 focus:outline-none rounded-sm text-sm w-auto px-5 py-2.5 text-center bg-accent hover:bg-blue-300"
        >
          Submit
        </button>
      </form>
      {error && <p className="text-lg text-red-500 pt-10">Error: {error}</p>}
    </div>
  );
}
