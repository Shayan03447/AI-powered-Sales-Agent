import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import NavLinks from "@/components/ui/NavLinks";
import { getPipelineCounts } from "@/lib/pipeline/counts";

/*
 * Server component — can await DB queries directly.
 * Active-link state and login-page hiding are handled inside
 * NavLinks (client component) via usePathname.
 */
export default async function AppNav() {
  const pipeline = await getPipelineCounts();

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

        <NavLinks counts={pipeline.counts} />
      </div>
    </header>
  );
}
