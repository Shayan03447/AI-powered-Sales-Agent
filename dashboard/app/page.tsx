import Link from "next/link";

export default function HomePage() {
  return (
    <main className="fade-in">
      <section className="hero-panel">
        <p className="eyebrow">Atrium Solution</p>
        <h1>Atrium Reach</h1>
        <p className="lede">
          Your outbound workspace — find local businesses, research websites,
          track campaigns, and review every lead.
        </p>
        <div className="hero-actions">
          <Link href="/find-leads" className="btn-primary-link">
            Start Find Leads
          </Link>
          <Link href="/research" className="btn-secondary-link">
            Start Research
          </Link>
        </div>
      </section>

      <section className="action-grid">
        <Link href="/find-leads" className="action-tile">
          <span className="tile-step">01</span>
          <h2>Find Leads</h2>
          <p>Enter business type and city to start a new search.</p>
        </Link>
        <Link href="/research" className="action-tile">
          <span className="tile-step">02</span>
          <h2>Research</h2>
          <p>Enrich new leads — find emails and website scores.</p>
        </Link>
        <Link href="/leads" className="action-tile">
          <span className="tile-step">03</span>
          <h2>Leads</h2>
          <p>Browse saved businesses, emails, status, and scores.</p>
        </Link>
      </section>
    </main>
  );
}
