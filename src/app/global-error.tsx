"use client";

import * as React from "react";
import { Logo } from "@/components/brand/logo";

/**
 * Global error boundary.
 * Catches rendering errors and shows a clean, branded recovery screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#ffffff", color: "#0f172a" }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
            color: "#ffffff",
            marginBottom: "20px",
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.5px" }}>
            MedSnap AI App
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px", maxWidth: "380px", lineHeight: "1.5" }}>
            {error?.message && !error.message.includes("Minified")
              ? error.message
              : "A temporary session glitch occurred. Click below to reload the app dashboard."}
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("medsnap-store-v3");
                  window.location.href = "/";
                } else {
                  reset();
                }
              }}
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              }}
            >
              Reload MedSnap App
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
