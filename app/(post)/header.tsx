"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect, useRef } from "react";
import { ago } from "time-ago";
import useSWR from "swr";
import type { Post } from "@/app/get-posts";
import { JsonLd, PERSON, personId } from "@/app/json-ld";
import { toISODate, year } from "@/app/date";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Header({ posts }: { posts: Post[] }) {
  const segments = useSelectedLayoutSegments();
  // segments can be:
  // date/post
  // lang/date/post
  const initialPost = posts.find(
    post => post.id === segments[segments.length - 1]
  );
  const { data: post, mutate } = useSWR(
    `/api/view?id=${initialPost?.id ?? ""}`,
    fetcher,
    {
      fallbackData: initialPost,
      refreshInterval: 5000,
    }
  );

  if (initialPost == null) return <></>;

  const url = `https://darioristic.com/${year(initialPost.date)}/${initialPost.id}`;

  return (
    <>
      <JsonLd
        data={[
          PERSON,
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": url,
            mainEntityOfPage: url,
            url,
            headline: initialPost.title,
            datePublished: toISODate(initialPost.date),
            image: `https://darioristic.com/og/${initialPost.id}`,
            inLanguage: "en",
            author: { "@id": personId },
            publisher: { "@id": personId },
            isPartOf: { "@id": "https://darioristic.com/#blog" },
          },
        ]}
      />

      <h1 className="text-2xl font-bold mb-1 dark:text-gray-100">
        {post.title}
      </h1>

      <p className="font-mono flex text-xs text-neutral-500 dark:text-neutral-500">
        <span className="flex-grow">
          <span className="hidden md:inline">
            <span>
              <a
                href="https://twitter.com/dario_ristic"
                className="hover:text-neutral-800 dark:hover:text-neutral-400"
                target="_blank"
              >
                @dario_ristic
              </a>
            </span>

            <span className="mx-2">|</span>
          </span>

          {/* since we will pre-render the relative time, over time it
           * will diverge with what the user relative time is, so we suppress the warning.
           * In practice this is not an issue because we revalidate the entire page over time
           * and because we will move this to a server component with template.tsx at some point */}
          <span suppressHydrationWarning={true}>
            {post.date} ({ago(post.date, true)} ago)
          </span>
        </span>

        <span className="pr-1.5">
          <Views
            id={post.id}
            mutate={mutate}
            defaultValue={post.viewsFormatted}
          />
        </span>
      </p>
    </>
  );
}

function Views({ id, mutate, defaultValue }) {
  const views = defaultValue;
  const didLogViewRef = useRef(false);

  useEffect(() => {
    if ("development" === process.env.NODE_ENV) return;
    if (!didLogViewRef.current) {
      const url = "/api/view?incr=1&id=" + encodeURIComponent(id);
      fetch(url)
        .then(res => res.json())
        .then(obj => {
          mutate(obj);
        })
        .catch(console.error);
      didLogViewRef.current = true;
    }
  });

  return <>{views != null ? <span>{views} views</span> : null}</>;
}
