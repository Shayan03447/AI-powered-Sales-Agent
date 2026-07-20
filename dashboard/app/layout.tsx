import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/ui/AppNav";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Atrium Reach | Atrium Solution",
  description:
    "Outbound sales dashboard by Atrium Solution — find leads, track campaigns, review results.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <div className="app-shell">
          <AppNav />
          {children}
        </div>
      </body>
    </html>
  );
}
