import "./globals.css";

import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "./analytics";
import { Header } from "./header";
import { Footer } from "./footer";
import { doge } from "./doge";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"]
});

export const metadata: Metadata = {
  title: "Dario Ristić's blog",
  description:
    "Dario Ristić is a technology executive and entrepreneur from Belgrade, Serbia. He leads Platforma, researching and building AI-native services, platforms, and hardware-enabled products.",
  openGraph: {
    title: "Dario Ristić's blog",
    description:
      "Dario Ristić is a technology executive and entrepreneur from Belgrade, Serbia. He leads Platforma, researching and building AI-native services, platforms, and hardware-enabled products.",
    url: "https://darioristic.com",
    siteName: "Dario Ristić's blog",
    images: ["/opengraph-image"],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@dario_ristic",
    creator: "@dario_ristic",
  },
  authors: [{ name: "Dario Ristić", url: "https://darioristic.com" }],
  creator: "Dario Ristić",
  publisher: "Dario Ristić",
  // inherited by every page that does not set its own `alternates`, so the
  // feed stays discoverable site-wide
  alternates: {
    types: {
      "application/atom+xml": "https://darioristic.com/atom",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  metadataBase: new URL("https://darioristic.com"),
};

export const viewport = {
  themeColor: "transparent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${geist.className} antialiased`}
      suppressHydrationWarning={true}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${doge.toString()})();`,
          }}
        />
      </head>

      <body className="dark:text-gray-100 max-w-2xl m-auto">
        <main className="p-6 pt-3 md:pt-6 min-h-screen">
          <Header />
          {children}
        </main>

        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
