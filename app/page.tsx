import type { Metadata } from "next";
import { Posts } from "./posts";
import { getPosts } from "./get-posts";
import { JsonLd, PERSON, personId, siteId } from "./json-ld";
import { toISODate, year } from "./date";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    types: {
      "application/atom+xml": "https://darioristic.com/atom",
    },
  },
};

export default async function Home() {
  const posts = await getPosts();
  return (
    <>
      <JsonLd
        data={[
          PERSON,
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": siteId,
            url: "https://darioristic.com",
            name: "Dario Ristić's blog",
            description:
              "Essays on platform engineering, AI-native architecture, and building technology organizations.",
            inLanguage: "en",
            author: { "@id": personId },
            publisher: { "@id": personId },
            blogPost: posts.map(post => ({
              "@type": "BlogPosting",
              headline: post.title,
              url: `https://darioristic.com/${year(post.date)}/${post.id}`,
              datePublished: toISODate(post.date),
            })),
          },
        ]}
      />
      <Posts posts={posts} />
    </>
  );
}
