import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OAuth Launchpad",
  description: "Know what it takes to connect your users' apps: OAuth app setup and approval guides with evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased min-h-screen overflow-x-hidden break-words`}>
        <header className="border-b border-line bg-panel">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              OAuth Launchpad
            </Link>
            <nav className="flex gap-3 text-sm text-muted sm:gap-4">
              <Link href="/#research" className="hover:text-fg">Research<span className="hidden sm:inline"> an app</span></Link>
              <Link href="/coverage" className="hover:text-fg">Coverage</Link>
              <Link href="/about" className="hover:text-fg">How it works</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-muted">
          Guidance is researched from provider documentation and labelled by evidence. It is not legal advice or a guarantee of approval.
        </footer>
      </body>
    </html>
  );
}
