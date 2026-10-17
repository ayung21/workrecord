"use client";

import { useEffect, useState } from "react";
import {
  AUTH_CHANGE_EVENT,
  readSession,
  type AuthSession,
} from "@/lib/auth/session";

/** Sesi klien — sinkron dengan localStorage dan event auth. */
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSession(readSession());
      setReady(true);
    };
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isLoggedIn = Boolean(session?.accessToken && session?.user);

  return { session, isLoggedIn, ready };
}
