import { type ReactNode } from "react";
import { Tweet as TweetType, getTweet } from "react-tweet/api";
import redis from "@/app/redis";
import { Caption } from "./caption";
import { TweetClient } from "./tweet-client";

interface TweetArgs {
  id: string;
  caption: ReactNode;
}

async function getAndCacheTweet(id: string): Promise<TweetType | undefined> {
  // we first prioritize getting a fresh tweet
  try {
    const tweet = await getTweet(id);

    // @ts-ignore
    if (tweet && !tweet.tombstone) {
      // we populate the cache if we have a fresh tweet
      if (redis) {
        await redis.set(`tweet:${id}`, tweet);
      }
      return tweet;
    }
  } catch (error) {
    console.error("tweet fetch error", error);
  }

  if (!redis) return undefined;

  const cachedTweet: TweetType | null = await redis.get(`tweet:${id}`);

  // @ts-ignore
}

export async function Tweet({ id, caption }: TweetArgs) {
  const tweet = await getAndCacheTweet(id);

  return (
    <div className="tweet my-6">
      <div className={`flex justify-center`}>
        <TweetClient tweet={tweet} />
      </div>
      {caption && <Caption>{caption}</Caption>}
    </div>
  );
}
