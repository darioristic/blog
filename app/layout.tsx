import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import { Analytics } from "./analytics";
import { doge } from "./doge";
import { Footer } from "./footer";
import { Header } from "./header";
import { WebsiteStructuredData, PersonStructuredData } from "./components/structured-data";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: {
    template: "%s | Dario Ristic",
    default: "Dario Ristic's blog",
  },
  description:
    "Dario Ristic is a technology executive and consultant specializing in DevSecOps, cloud infrastructure, platform engineering, and high-performing cross-functional teams.",
  keywords: [
    "Dario Ristic",
    "cloud infrastructure",
    "DevSecOps",
    "cloud-native",
    "platform engineering",
    "technology blog",
    "Kubernetes",
    "OpenShift",
    "AI platform",
    "IT consulting",
  ],
  authors: [{ name: "Dario Ristic", url: "https://darioristic.com" }],
  creator: "Dario Ristic",
  publisher: "Dario Ristic",
  openGraph: {
    title: "Dario Ristic's blog",
    description:
      "Dario Ristic is a technology executive and consultant specializing in DevSecOps, cloud infrastructure, platform engineering, and high-performing cross-functional teams.",
    url: "https://darioristic.com",
    siteName: "Dario Ristic's blog",
    type: "website",
    locale: "en_US",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dario_ristic",
    creator: "@dario_ristic",
  },
  metadataBase: new URL("https://darioristic.com"),
  alternates: {
    canonical: "https://darioristic.com",
  },
};

export const viewport = {
  themeColor: "transparent",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
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
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS for above-the-fold content */
              body{margin:0;font-family:var(--font-geist-sans),system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
              .max-w-2xl{max-width:42rem;margin-left:auto;margin-right:auto}
              .p-6{padding:1.5rem}
              .pt-3{padding-top:.75rem}
              .mb-1{margin-bottom:.25rem}
              .text-2xl{font-size:1.5rem;line-height:2rem}
              .font-bold{font-weight:700}
              .dark\\:text-gray-100{color:rgb(243 244 246)}
              @media(prefers-color-scheme:dark){body{background-color:#1C1C1C;color:#f3f4f6}}
            `,
          }}
        />
        <script
          defer
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Necessary for doge easter egg
          dangerouslySetInnerHTML={{
            __html: `(${doge.toString()})();`,
          }}
        />
      </head>

      <body className="text-neutral-900 dark:text-gray-100 max-w-2xl m-auto" suppressHydrationWarning={true}>
        <WebsiteStructuredData url="https://darioristic.com" />
        <PersonStructuredData />
        
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
