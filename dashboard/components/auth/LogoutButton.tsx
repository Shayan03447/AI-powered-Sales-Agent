"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /** Override the button's className — e.g. for the mobile drawer variant. */
  className?: string;
}

export default function LogoutButton({ className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={className ?? "nav-logout"}
      onClick={onLogout}
      disabled={loading}
    >
      {loading ? "…" : "Logout"}
    </button>
  );
}
