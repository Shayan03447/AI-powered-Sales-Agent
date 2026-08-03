"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import type { PipelineCounts } from "@/lib/pipeline/counts";
import styles from "./NavLinks.module.css";

/*
 * Pipeline steps — order matches the 5-stage workflow.
 * badge: key from PipelineCounts that drives the count indicator.
 */
const PIPELINE: Array<{
  href: string;
  label: string;
  badge?: keyof PipelineCounts;
}> = [
  { href: "/", label: "Home" },
  { href: "/find-leads", label: "Find Leads" },
  { href: "/research", label: "Research" },
  { href: "/ai-draft", label: "AI Draft" },
  { href: "/drafts", label: "Drafts", badge: "pendingReview" },
  { href: "/send", label: "Send", badge: "approved" },
];

const RECORDS: Array<{ href: string; label: string }> = [
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
];

interface Props {
  counts: PipelineCounts;
}

export default function NavLinks({ counts }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer whenever the active route changes (after navigation).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scrolling while the mobile drawer is open.
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);

  // Hide all navigation on the login page — brand mark is shown by AppNav.
  if (pathname === "/login") return null;

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Desktop navigation (hidden below 768 px) ─────────────────────── */}
      <nav aria-label="Primary" className={styles.desktopNav}>
        {/* Pipeline group */}
        <div className={styles.group} role="group" aria-label="Pipeline steps">
          {PIPELINE.map((link) => {
            const count = link.badge ? (counts[link.badge] ?? 0) : 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${isActive(link.href) ? " active" : ""}`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
                {count > 0 && (
                  <span
                    className={styles.badge}
                    aria-label={`${count} item${count !== 1 ? "s" : ""} pending`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {/* Records group */}
        <div className={styles.group} role="group" aria-label="Records">
          {RECORDS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${isActive(link.href) ? " active" : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {/* Account */}
        <LogoutButton />
      </nav>

      {/* ── Hamburger button (visible below 768 px) ──────────────────────── */}
      <button
        type="button"
        className={`${styles.hamburger}${drawerOpen ? ` ${styles.hamburgerOpen}` : ""}`}
        onClick={toggleDrawer}
        aria-expanded={drawerOpen}
        aria-controls="mobile-nav-drawer"
        aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <span className={styles.hamburgerIcon} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* ── Overlay — click outside to close ─────────────────────────────── */}
      {drawerOpen && (
        <div
          className={styles.overlay}
          aria-hidden="true"
          onClick={closeDrawer}
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`${styles.drawer}${drawerOpen ? ` ${styles.drawerOpen}` : ""}`}
      >
        {/* Drawer header */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerBrand}>Atrium Reach</span>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        {/* Scrollable nav content */}
        <nav className={styles.drawerContent} aria-label="Mobile primary">
          {/* PIPELINE */}
          <div className={styles.drawerSection}>
            <span className={styles.drawerGroupLabel}>Pipeline</span>
            {PIPELINE.map((link) => {
              const count = link.badge ? (counts[link.badge] ?? 0) : 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.drawerLink}${isActive(link.href) ? ` ${styles.drawerLinkActive}` : ""}`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                  {count > 0 && (
                    <span
                      className={styles.badge}
                      aria-label={`${count} item${count !== 1 ? "s" : ""} pending`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <hr className={styles.drawerDivider} />

          {/* RECORDS */}
          <div className={styles.drawerSection}>
            <span className={styles.drawerGroupLabel}>Records</span>
            {RECORDS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.drawerLink}${isActive(link.href) ? ` ${styles.drawerLinkActive}` : ""}`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <hr className={styles.drawerDivider} />

          {/* ACCOUNT */}
          <div className={styles.drawerSection}>
            <span className={styles.drawerGroupLabel}>Account</span>
            <LogoutButton className={styles.drawerLogout} />
          </div>
        </nav>
      </div>
    </>
  );
}
