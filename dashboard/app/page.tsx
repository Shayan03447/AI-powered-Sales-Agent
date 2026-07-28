import Link from "next/link";

export default function HomePage() {
  return (
    <main className="fade-in">
      <section className="hero-panel">
        <p className="eyebrow">Atrium Solution</p>
        <h1>Atrium Reach</h1>
        <p className="lede">
          Find businesses, research websites, draft AI emails, and approve
          before anything is sent. Email send enables later with your company
          domain.
        </p>
        <div className="hero-actions">
          <Link href="/find-leads" className="btn-primary-link">
            Start Find Leads
          </Link>
          <Link href="/ai-draft" className="btn-secondary-link">
            Create AI Emails
          </Link>
        </div>
      </section>

      <section className="action-grid action-grid-4">
        <Link href="/find-leads" className="action-tile">
          <span className="tile-step">01</span>
          <h2>Find Leads</h2>
          <p>Search by business type and city.</p>
        </Link>
        <Link href="/research" className="action-tile">
          <span className="tile-step">02</span>
          <h2>Research</h2>
          <p>Find emails and website scores.</p>
        </Link>
        <Link href="/ai-draft" className="action-tile">
          <span className="tile-step">03</span>
          <h2>AI Draft</h2>
          <p>Generate audit + personalized emails.</p>
        </Link>
        <Link href="/drafts" className="action-tile">
          <span className="tile-step">04</span>
          <h2>Drafts</h2>
          <p>Approve, edit, or reject AI emails.</p>
        </Link>
      </section>
    </main>
  );
}
