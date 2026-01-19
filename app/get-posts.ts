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

export const getPosts = async () => {
  let allViews: null | Views = null;

  try {
    allViews = await Promise.race([
      redis.hgetall("views"),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 1500)
      ),
    ]) as Views;
  } catch (e) {
    console.error("Failed to fetch views:", e);
  }

  const posts = postsData.posts.map((post): Post => {
    const views = Number(allViews?.[post.id] ?? 0);
    return {
      ...post,
      views,
      viewsFormatted: commaNumber(views),
    };
  });
  return posts;
};
