import type { Metadata } from "next";
import { Inter, Sofia_Sans_Condensed, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

// Body / utility-surface reading font (calculators, database, long text)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Display font — the giant condensed uppercase headings (Olha reference)
const sofia = Sofia_Sans_Condensed({
  variable: "--font-sofia",
  subsets: ["latin"],
  display: "swap",
});

// Mono labels — nav, tags, captions, metadata (Olha reference)
const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Joseph Vu — Engineering Portfolio",
  description:
    "Engineering portfolio, working calculators, and a technical file library by Joseph Vu — automation & production engineer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sofia.variable} ${splineMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
