"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 60 * 1000;

/**
 * Sends a heartbeat every minute while the dashboard tab is visible, so the
 * admin panel can show "online now" and time spent. If the account gets
 * blocked or force-logged-out, the user is signed out within a minute.
 */
export default function ActivityTracker() {
  useEffect(() => {
    let stopped = false;

    const beat = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/activity", { method: "POST" });
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          stopped = true;
          window.location.href = `/api/auth/logout?reason=${data.status === "blocked" ? "blocked" : "expired"}`;
        }
      } catch {
        // offline — try again next time
      }
    };

    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => document.visibilityState === "visible" && beat();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
