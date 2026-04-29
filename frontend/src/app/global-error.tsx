"use client";

import "./globals.css";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background:
              "radial-gradient(circle at top, rgba(5, 125, 188, 0.18), transparent 48%), #000",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "24px",
              background: "rgba(17, 17, 17, 0.92)",
              padding: "32px",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.24em", textTransform: "uppercase", color: "#7c7c7c" }}>
              Application error
            </div>
            <h1 style={{ marginTop: "12px", fontSize: "32px", lineHeight: 1.1, fontWeight: 600 }}>
              The app shell failed, but you can recover without restarting.
            </h1>
            <p style={{ marginTop: "12px", color: "#a1a1a1", fontFamily: "var(--font-mono)", fontSize: "14px", lineHeight: 1.7 }}>
              If a root layout or shared module throws, this page keeps the error visible and the
              recovery path live.
            </p>

            <div
              style={{
                marginTop: "20px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                background: "rgba(0, 0, 0, 0.45)",
                padding: "16px",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#7c7c7c" }}>
                Error
              </div>
              <pre style={{ marginTop: "8px", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#fca5a5" }}>
                {error.message}
              </pre>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={reset}
                style={{
                  height: "40px",
                  borderRadius: "10px",
                  border: "0",
                  padding: "0 16px",
                  background: "#057dbc",
                  color: "#fff",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  height: "40px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  padding: "0 16px",
                  background: "transparent",
                  color: "#d4d4d4",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
