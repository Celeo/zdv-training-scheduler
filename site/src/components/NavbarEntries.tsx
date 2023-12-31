import * as jose from "jose";
import type { JwtPayload } from "../util/auth.ts";
import { ADMIN_ROLES } from "../util/constants.ts";

function Link(props: { href: string; name: string }): JSX.Element {
  const onPage = window.location.pathname === props.href;
  return (
    <li>
      <a
        href={props.href}
        className={
          "block p-0 rounded hover:text-sky-300 " +
          (onPage ? "text-violet-300" : "")
        }
      >
        {props.name}
      </a>
    </li>
  );
}

export function NavbarEntries() {
  const jwt = localStorage.getItem("jwt");
  let isAdmin = false;
  if (jwt) {
    /*
     * This is simply a decode - not a verify. The individual routes
     * have authorization checks, so this doesn't need to be "secure".
     * If someone modifies their JWT to have an admin role in it, they'll
     * get to see the link in the navbar, but that's it.
     *
     * I could round-trip it to the backend for proper verification,
     * but that'd have to be performed on every page load, which seems
     * gratuitous.
     */
    const claims = jose.decodeJwt(jwt) as JwtPayload;
    isAdmin =
      claims.info.roles.includes("wm") ||
      claims.info.roles.some((r) => ADMIN_ROLES.includes(r));
  }

  return (
    <ul className="flex flex-row space-x-8">
      {jwt !== null ? (
        <>
          <Link href="/scheduling" name="Scheduling" />
          <Link href="/prefs" name="Prefs" />
          {isAdmin && <Link href="/admin" name="Admin" />}
          <Link href="/sso/logout" name="Log out" />
        </>
      ) : (
        <Link href="/sso/login" name="Log in" />
      )}
    </ul>
  );
}
