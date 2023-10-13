import { useEffect, useState } from "react";

export function Preferences() {
  const [email, setEmail] = useState(false);
  const [discord, setDiscord] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      const resp = await fetch("/api/prefs", {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      const data = await resp.json();
      setEmail(data.receiveEmails);
      setDiscord(data.receiveDiscordMessages);
    })();
    // no args - called only on mount
  }, []);

  const submit = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    event.preventDefault();
    try {
      const resp = await fetch("/api/prefs", {
        headers: { authorization: `Bearer ${localStorage.getItem("jwt")}` },
        method: "PUT",
        body: JSON.stringify({ email, discord }),
      });
      if (resp.status !== 200) {
        console.error(`Error saving preferences, response code ${resp.status}`);
        setError(`could not save preferences`);
      } else {
        window.location.reload();
      }
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
