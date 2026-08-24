"use client";
import Script from "next/script";

export function Analytics() {
  return (
    <>
      <Script
        src="https://umami.darioristic.com/umami/script.js"
        data-website-id="3e9e053b-1ed1-11f1-ba13-96000415b3cd"
        strategy="afterInteractive"
      />
    </>
  );
}
