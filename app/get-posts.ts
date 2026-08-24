import { unstable_cache } from "next/cache";
import postsData from "./posts.json";
import redis from "./redis";
import commaNumber from "comma-number";

export type Post = {
  id: string;
  date: string;
  title: string;
  views: number;
  viewsFormatted: string;
};

// shape of the HSET in redis
type Views = {
  [key: string]: string;
};

const readViews = async (): Promise<null | Views> =>
  redis ? await redis.hgetall("views") : null;

// An uncached fetch during render opts the route out of static generation, so
// reading Redis directly turns every page into a function invocation plus a
// round trip to the origin server. Caching it for the same 300s the pages
// already declare as their revalidate window keeps them prerendered and
// CDN-cacheable; the client-side SWR poll is what keeps the numbers moving.
const readViewsCached = unstable_cache(readViews, ["views"], {
  revalidate: 300,
  tags: ["views"],
});

const withViews = (allViews: null | Views): Post[] =>
  postsData.posts.map((post): Post => {
    const views = Number(allViews?.[post.id] ?? 0);
    return {
      ...post,
      views,
      viewsFormatted: commaNumber(views),
    };
  });

/** For rendering pages. Cached, so the page stays statically generated. */
export const getPosts = async () => withViews(await readViewsCached());

/** For /api/posts, which SWR polls -- must not serve a cached snapshot. */
export const getPostsLive = async () => withViews(await readViews());
