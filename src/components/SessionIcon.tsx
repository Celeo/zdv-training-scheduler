import { useState, useEffect } from "react";

function SessionIconUser() {
  return (
    <div className="float-right relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full mt-3 mr-3 cursor-pointer">
      <span className="font-medium text-gray-600">JL</span>
    </div>
  );
}

function SessionIconAnon() {
  return (
    <div className="float-right mt-3 mr-5">
      <a
        href="/sso/login"
        className="text-blue-900 bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 mr-2 mb-2"
      >
        Log in
      </a>
    </div>
  );
}

export function SessionIcon() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("sso-access-token") !== null);
  });

  return isLoggedIn ? <SessionIconUser /> : <SessionIconAnon />;
}
