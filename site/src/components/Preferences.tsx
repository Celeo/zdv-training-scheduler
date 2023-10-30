import { useEffect, useState } from "react";
import { sendAlert } from "../data";
import { callEndpoint } from "../util/http";

type EndpointData = {
  receiveEmails: boolean;
  receiveDiscordMessages: boolean;
};

export function Preferences() {
  const [serverValues, setServerValues] = useState<EndpointData>({
    receiveEmails: false,
    receiveDiscordMessages: false,
  });
  const [email, setEmail] = useState(false);
  const [discord, setDiscord] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadData = async (): Promise<void> => {
    const data = await callEndpoint<EndpointData>("/api/prefs", {
      returnData: true,
    });
    setServerValues(data!);
    setEmail(data!.receiveEmails);
    setDiscord(data!.receiveDiscordMessages);
    setDirty(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setDirty(
      email !== serverValues.receiveEmails ||
        discord !== serverValues.receiveDiscordMessages,
    );
  }, [email, discord]);

  const submit = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    event.preventDefault();
    try {
      await callEndpoint("/api/prefs", {
        method: "PUT",
        body: { email, discord },
      });
      await loadData();
      sendAlert("INFO", "Preferences saved");
    } catch (err) {
      console.error(`Error saving preferences: ${err}`);
      sendAlert("ERROR", "Could not save your preferences");
    }
  };

  return (
    <div className="pt-5 px-5 lg:px-0 max-w-1xl lg:max-w-3xl mx-auto">
      <h2 className="text-2xl pb-8">Preferences</h2>
      <p>
        These notification preferences control where you will get notifications:
      </p>
      <ul className="list-disc list-inside pb-4 -ml-2">
        <li>You accepting a session</li>
        <li>A student (un-)accepting your session</li>
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
                className="w-4 h-4 rounded ring-offset-gray-800 focus:ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
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
                className="w-4 h-4 rounded ring-offset-gray-800 focus:ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
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
          className={`text-black focus:ring-4 focus:outline-none rounded-xl text-sm w-auto px-5 py-2.5 text-center ${
            dirty && (email || discord)
              ? "bg-sky-400 hover:bg-sky-300"
              : "bg-gray-500"
          }`}
          disabled={!dirty || (!email && !discord)}
        >
          Submit
        </button>
      </form>
    </div>
  );
}
