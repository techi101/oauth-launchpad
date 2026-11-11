import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import Icon from "@/components/Icon";
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
      <body className={`${sans.variable} ${mono.variable} min-h-screen overflow-x-hidden break-words antialiased`}>
        <header className="sticky top-0 z-30 border-b border-line/80 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                <Icon name="key" className="h-4 w-4" />
              </span>
              <span>OAuth Launchpad</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/#library" className="hidden rounded-md px-3 py-2 text-slate-600 hover:bg-subtle hover:text-fg sm:inline-block">Library</Link>
              <Link href="/coverage" className="hidden rounded-md px-3 py-2 text-slate-600 hover:bg-subtle hover:text-fg sm:inline-block">Coverage</Link>
              <Link href="/about" className="hidden rounded-md px-3 py-2 text-slate-600 hover:bg-subtle hover:text-fg md:inline-block">How it works</Link>
              <Link href="/#research" className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-fg px-3.5 py-2 font-medium text-white shadow-sm hover:bg-slate-800">
                <Icon name="sparkles" className="h-4 w-4" /> Research an app
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <footer className="border-t border-line bg-subtle">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
            <div>
              <p className="flex items-center gap-2 font-semibold text-fg">
                <Icon name="key" className="h-4 w-4 text-accent" /> OAuth Launchpad
              </p>
              <p className="mt-2 max-w-sm">
                Setup and approval guides for the OAuth apps your AI agent needs. Every claim links to the provider&apos;s own docs. Not legal
                advice or a guarantee of approval.
              </p>
            </div>
            <div className="grid content-start gap-1.5">
              <p className="font-medium text-fg">Product</p>
              <Link href="/#library" className="hover:text-fg">App library</Link>
              <Link href="/#research" className="hover:text-fg">Research an app</Link>
              <Link href="/coverage" className="hover:text-fg">Coverage</Link>
            </div>
            <div className="grid content-start gap-1.5">
              <p className="font-medium text-fg">For agents</p>
              <a href="/llms.txt" className="hover:text-fg">llms.txt</a>
              <a href="/api/guides" className="hover:text-fg">JSON API</a>
              <a href="https://github.com/techi101/oauth-launchpad" className="hover:text-fg">Source on GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
