import { useState, useEffect } from "react";

export function NavbarEntries() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const valid = localStorage.getItem("sso-access-token") !== null;
    setIsLoggedIn(valid);
    (window as Record<string, any>).sso_valid = valid;
  });

  return (
    <ul className="flex flex-row space-x-8">
      <li>
        <a href="#" className="block p-0 rounded hover:text-blue-500">
          Home
        </a>
      </li>
      <li>
        {isLoggedIn ? (
          <a
            href="/sso/logout"
            className="block p-0 rounded hover:text-blue-500"
          >
            Log out
          </a>
        ) : (
          <a
            href="/sso/login"
            className="block p-0 rounded hover:text-blue-500"
          >
            Log in
          </a>
        )}
      </li>
    </ul>
  );
}
