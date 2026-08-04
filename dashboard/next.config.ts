import type { NextConfig } from "next";
import { randomBytes } from "crypto";

/**
 * A fresh random nonce generated each time next.config.ts is evaluated
 * (i.e. every server start). It is injected as an env variable so both
 * the Edge middleware and Node API routes can read the same value.
 * Any session token that does not carry this nonce is rejected, which
 * forces re-login after every server restart.
 */
const BOOT_NONCE = randomBytes(8).toString("hex");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SERVER_BOOT_NONCE: BOOT_NONCE,
  },
  async redirects() {
    return [
      {
        // Old /review route permanently redirects to /drafts
        source: "/review",
        destination: "/drafts",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
