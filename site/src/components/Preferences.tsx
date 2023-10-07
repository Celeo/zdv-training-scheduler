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
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="alertsEmail"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Receive notifications over email
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                id="alertsDiscord"
                type="checkbox"
                checked={discord}
                onChange={() => setDiscord(!discord)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="alertsDiscord"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Receive notifications over Discord
              </label>
            </div>
          </fieldset>
        </div>
        <button
          type="submit"
          onClick={submit}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Submit
        </button>
      </form>
      {error && <p className="text-lg text-red-500 pt-10">Error: {error}</p>}
    </div>
  );
}
