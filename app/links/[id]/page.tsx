import type { Metadata } from "next";
import links from "@/links.json";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const link = links[id];

  if (link == null) return {};

  return {
    title: link.title,
    description: link.description,
    // these pages only exist to carry a preview card into a redirect, so they
    // must never end up in the index themselves
    robots: { index: false, follow: false },
    openGraph: {
      title: link.title,
      description: link.description,
      siteName: "Dario Ristić",
      images: [`https://darioristic.com/og/${link.image}`],
    },
    twitter: {
      card: "summary_large_image",
      site: "@dario_ristic",
      title: link.title,
      description: link.description,
      images: [`https://darioristic.com/og/${link.image}`],
    },
  };
}

export default async function Link(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bot?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const link = links[params.id];

  if (link == null) {
    return notFound();
  }

  if (
    searchParams.bot ||
    /bot/i.test((await headers()).get("user-agent") as string)
  ) {
    return <></>;
  } else {
    redirect(link.link);
  }
}
