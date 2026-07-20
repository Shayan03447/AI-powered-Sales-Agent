"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";

const links = [
  { href: "/", label: "Home" },
  { href: "/find-leads", label: "Find Leads" },
  { href: "/research", label: "Research" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link href="/" className="brand">
          <BrandLogo size={32} />
          <span>
            Atrium Reach
            <small>by Atrium Solution</small>
          </span>
        </Link>
        <nav>
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "nav-link active" : "nav-link"}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
