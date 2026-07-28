"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import LogoutButton from "@/components/auth/LogoutButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/find-leads", label: "Find Leads" },
  { href: "/research", label: "Research" },
  { href: "/ai-draft", label: "AI Draft" },
  { href: "/drafts", label: "Drafts" },
  { href: "/send", label: "Send" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
];

export default function AppNav() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link href={isLogin ? "/login" : "/"} className="brand">
          <BrandLogo size={32} />
          <span>
            Atrium Reach
            <small>by Atrium Solution</small>
          </span>
        </Link>

        {!isLogin && (
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
            <LogoutButton />
          </nav>
        )}
      </div>
    </header>
  );
}
