"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            background: "#0c0a09",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <div style={{ maxWidth: "420px" }}>
            <p style={{ color: "#fca5a5", fontSize: "14px", fontWeight: 600 }}>
              Application error
            </p>
            <h1 style={{ marginTop: "8px", fontSize: "32px", lineHeight: 1.1 }}>
              The app hit a startup problem.
            </h1>
            <p style={{ marginTop: "12px", color: "#a8a29e", fontSize: "14px" }}>
              {error.message}
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "24px",
                border: 0,
                borderRadius: "6px",
                background: "#ffffff",
                color: "#0c0a09",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
