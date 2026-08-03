"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/** Find Leads form only — no tables on this page */
export default function FindLeadsForm() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("AU");
  const [source, setSource] = useState("both");
  const [maxResults, setMaxResults] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/workflows/find-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_type: businessType,
          city,
          country,
          source,
          max_results: maxResults,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        const detail = data.detail
          ? `\n${String(data.detail).slice(0, 300)}`
          : "";
        setError((data.error || "Could not start search") + detail);
        return;
      }

      const suburbNote = data.suburb
        ? ` Searching near ${data.suburb}.`
        : "";
      setMessage(
        "Search started." +
          suburbNote +
          " New campaign will appear on the Campaigns page in about 30–90 seconds."
      );

      setTimeout(() => {
        router.push("/campaigns");
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error — is the dashboard server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={onSubmit}>
      <h2>Find Leads</h2>
      <p className="muted">
        Enter business type and city. The system will search and save results.
        Check progress on the Campaigns and Leads pages.
      </p>
      <p className="muted">
        Large metros (Sydney, Melbourne, Brisbane, Perth, Adelaide) rotate
        suburbs on each run so Google returns a fresher set of businesses.
      </p>

      {loading && (
        <div className="banner banner-loading">
          Searching… please wait. Do not click again.
        </div>
      )}

      <label>
        Business type
        <input
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="e.g. plumber"
          required
          disabled={loading}
        />
      </label>

      <label>
        City
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Sydney"
          required
          disabled={loading}
        />
      </label>

      <label>
        Country
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="AU"
          disabled={loading}
        />
      </label>

      <label>
        Source
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={loading}
        >
          <option value="both">Google + Yelp</option>
          <option value="gmb">Google only</option>
          <option value="yelp">Yelp only</option>
        </select>
      </label>

      <label>
        Max results
        <input
          type="number"
          min={1}
          max={20}
          value={maxResults}
          onChange={(e) => setMaxResults(Number(e.target.value) || 10)}
          disabled={loading}
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Starting search…" : "Start Find Leads"}
      </button>

      <Link href="/campaigns" className="btn-link">
        View campaigns →
      </Link>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </form>
  );
}
