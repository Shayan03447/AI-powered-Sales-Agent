"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch {
      setError("Network error — is the dashboard server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fade-in login-page">
      <div className="card login-card">
        <div className="login-brand">
          <BrandLogo size={40} />
          <div>
            <h1>Atrium Reach</h1>
            <p className="muted">Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <label>
            Username
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <Button type="submit" loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          {error && <p className="error-box">{error}</p>}
        </form>
      </div>
    </main>
  );
}
