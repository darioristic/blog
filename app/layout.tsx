import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import { Analytics } from "./analytics";
import { doge } from "./doge";
import { Footer } from "./footer";
import { Header } from "./header";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"]
});

export const metadata = {
  title: "Dario Ristic's blog",
  description:
    "Dario Ristic is a technology executive and consultant focused on DevOps, cloud infrastructure, and cross-functional teams.",
  openGraph: {
    title: "Dario Ristic's blog",
    description:
      "Dario Ristic is a technology executive and consultant focused on DevOps, cloud infrastructure, and cross-functional teams.",
    url: "https://darioristic.com",
    siteName: "Dario Ristic's blog",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dario_ristic",
    creator: "@dario_ristic",
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
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Necessary for doge easter egg
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
