import Link from "next/link";

export const metadata = { title: "404 Not Found — Atrium Reach" };

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 480,
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          padding: "36px 28px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          404
        </p>

        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1.4rem",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Page not found
        </h1>

        <p style={{ color: "var(--ink-soft)", marginBottom: 28 }}>
          The page you&apos;re looking for doesn&apos;t exist. It may have been
          moved or the URL might be incorrect.
        </p>

        <Link href="/" className="btn-primary-link">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
