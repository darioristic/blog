"use client";
import { Analytics as AnalyticsComponent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

export function Analytics() {
  return (
    <>
      <AnalyticsComponent />
      <SpeedInsights />
      <Script
        src="https://darioristic.com/umami/script.js"
        data-website-id="3e9e053b-1ed1-11f1-ba13-96000415b3cd"
        strategy="afterInteractive"
      />
    </>
  );
}
