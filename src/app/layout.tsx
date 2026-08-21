import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Climatle Unlimited",
  description: "Guess the country based on its climate change statistics. Inspired by Tradle.",
  openGraph: {
    title: "Climatle",
    description: "Can you guess the country from its 24 climate stats?",
    url: "https://climatle.carlosrodriguezpardo.es",
    siteName: "Climatle",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Climatle",
    description: "Can you guess the country from its 24 climate stats?",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white min-h-screen">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
