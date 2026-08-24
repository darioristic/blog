export const personId = "https://darioristic.com/#person";
export const siteId = "https://darioristic.com/#blog";

export const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": personId,
  name: "Dario Ristić",
  alternateName: "Dario Ristic",
  url: "https://darioristic.com",
  image: "https://darioristic.com/images/dario_ristic.png",
  jobTitle: "Technology Executive and Entrepreneur",
  description:
    "Dario Ristić is a technology executive and entrepreneur from Belgrade, Serbia. He leads Platforma, researching and building AI-native services, platforms, and hardware-enabled products.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Belgrade",
    addressCountry: "RS",
  },
  worksFor: { "@type": "Organization", name: "Platforma" },
  sameAs: ["https://twitter.com/dario_ristic"],
};

/**
 * Structured data for search engines. Rendered as a plain script tag because
 * JSON-LD is data, not markup — React never touches it after hydration.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
