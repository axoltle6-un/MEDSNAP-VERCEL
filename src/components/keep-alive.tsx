"use client";

import { useEffect } from "react";

/**
 * Keep-alive component that pings the server every 60 seconds.
 * This prevents the sandbox/serverless environment from going inactive
 * while the user is using the app.
 */
export function KeepAlive() {
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch("/api/health", { method: "GET" }).catch(() => {});
      } catch {}
    };

    // Ping immediately on mount
    ping();

    // Then ping every 60 seconds
    const interval = setInterval(ping, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
