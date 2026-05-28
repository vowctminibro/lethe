"use client";

// Next.js 16.2.6 regression: the internal /_global-error page fails to
// prerender ("Cannot read properties of null (reading 'useContext')").
// Providing our own + forcing it dynamic with inline styles sidesteps
// both the broken prerender and any CSS framework needing a React tree.

import { useEffect } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error.tsx]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0a0f",
          color: "#e8e8f0",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1.5rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#a78bfa",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Something broke
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "1rem 0",
            maxWidth: 480,
          }}
        >
          {error.message?.slice(0, 200) || "Unexpected error."}
        </h1>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            background: "#8b5cf6",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            border: 0,
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p style={{ marginTop: "1rem", color: "rgba(232,232,240,0.3)", fontSize: 11 }}>
            digest {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
