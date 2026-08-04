"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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
        setError(data.error || "Could not start search");
        setLoading(false); // re-enable form on error only
        return;
      }

      const suburbNote = data.suburb
        ? ` Searching near ${data.suburb}.`
        : "";
      setMessage(
        "Search started." +
          suburbNote +
          " Redirecting to Campaigns…"
      );

      // Keep form disabled during the redirect delay to prevent double-submit.
      setTimeout(() => {
        router.push("/campaigns");
        router.refresh();
      }, 1200);
    } catch {
      setError("Network error — is the dashboard server running?");
      setLoading(false); // re-enable form on network error
    }
  }

  return (
    <Card as="form" variant="action" onSubmit={onSubmit}>
      <h2>New Search</h2>
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
          Search in progress… this may take a minute.
        </div>
      )}

      <label>
        Business type
        <input
          name="businessType"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="e.g. plumber"
          required
          disabled={loading}
          autoComplete="off"
        />
      </label>

      <label>
        City
        <input
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Sydney"
          required
          disabled={loading}
          autoComplete="off"
        />
      </label>

      <label>
        Country code
        <input
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          placeholder="AU"
          required
          minLength={2}
          maxLength={3}
          pattern="[A-Za-z]{2,3}"
          title="2 or 3 letter country code, e.g. AU or USA"
          disabled={loading}
        />
      </label>

      <label>
        Source
        <select
          name="source"
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
        Max results (1–20 businesses)
        <input
          name="maxResults"
          type="number"
          min={1}
          max={20}
          value={maxResults}
          onChange={(e) => {
            const v = Math.max(1, Math.min(20, Number(e.target.value) || 1));
            setMaxResults(v);
          }}
          disabled={loading}
        />
      </label>

      <Button type="submit" loading={loading}>
        {loading ? "Starting search…" : "Start Find Leads"}
      </Button>

      <Link href="/campaigns" className="btn-link">
        View campaigns →
      </Link>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </Card>
  );
}
