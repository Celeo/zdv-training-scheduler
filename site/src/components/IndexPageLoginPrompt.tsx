import { useState, useEffect } from "react";

export function IndexPageLoginPrompt() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("jwt") !== null);
    // no args - called only on mount
  }, []);

  if (isLoggedIn) {
    return <></>;
  }
  return (
    <p className="text-lg pt-5">
      To get started,{" "}
      <a href="/sso/login" className="underline text-accent">
        log in
      </a>
      .
    </p>
  );
}
