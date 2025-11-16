import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export const meta = () => {
  [
    { title: "GetHired - Auth" },
    { name: "description", content: "Authentication Page for GetHired" },
  ];
};

const auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = location.search.split("next=")[1];
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(next);
    }
  }, [auth.isAuthenticated, next]);
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover flex items-center justify-center min-h-screen">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white p-10 rounded-2xl">
          <div className="flex flex-col text-center items-center gap-2">
            <h1>Welcome</h1>
            <h2>LogIn to continue your job search!</h2>
          </div>
          <div className="">
            {isLoading ? (
              <button className="auth-button animate-pulse">
                <p>Signing In...</p>
              </button>
            ) : (
              <>
                {auth.isAuthenticated ? (
                  <button className="auth-button" onClick={auth.signOut}>
                    <p>Log Out</p>
                  </button>
                ) : (
                  <button className="auth-button" onClick={auth.signIn}>
                    <p>Log In</p>
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default auth;
