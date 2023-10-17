import { useEffect, useState } from "react";

export function IndexPageLoginPrompt() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("jwt") !== null);
  }, []);

  if (isLoggedIn) {
    return <></>;
  }
  return (
    <p className="text-lg pt-5">
      To get started,{" "}
      <a
        href="/sso/login"
        className="underline text-sky-300 hover:text-sky-200"
      >
        log in
      </a>
      .
    </p>
  );
}
