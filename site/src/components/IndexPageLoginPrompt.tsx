import { effect, useSignal } from "@preact/signals-react";

export function IndexPageLoginPrompt() {
  const isLoggedIn = useSignal(false);

  effect(() => {
    isLoggedIn.value = localStorage.getItem("jwt") !== null;
  });

  if (isLoggedIn.value) {
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
