export function NavbarEntries() {
  const isLoggedIn = localStorage.getItem("jwt") !== null;

  return (
    <ul className="flex flex-row space-x-8">
      <li>
        <a href="/" className="block p-0 rounded hover:text-blue-500">
          Home
        </a>
      </li>
      {isLoggedIn ? (
        <>
          <li>
            <a
              href="/scheduling"
              className="block p-0 rounded hover:text-blue-500"
            >
              Scheduling
            </a>
          </li>
          <li>
            <a
              href="/sso/logout"
              className="block p-0 rounded hover:text-blue-500"
            >
              Log out
            </a>
          </li>
        </>
      ) : (
        <a href="/sso/login" className="block p-0 rounded hover:text-blue-500">
          Log in
        </a>
      )}
    </ul>
  );
}
