import { HeaderWrapper } from "./header-wrapper";
import { getPosts } from "../get-posts";
import { ArticleStructuredData } from "../components/structured-data";

export const revalidate = 300;

export default async function Layout({ children }) {
  const posts = await getPosts();

  return (
    <>
      <article className="text-neutral-900 dark:text-gray-300 mb-10">
        <HeaderWrapper posts={posts} />

        {children}
      </article>
    </>
  );
}
