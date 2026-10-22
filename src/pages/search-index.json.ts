import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  const items = posts.map((post) => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags,
    pubDate: post.data.pubDate.toISOString(),
    content: (post.body ?? '').replace(/[#*`>\-\[\]()!]|```[\s\S]*?```/g, ' ').replace(/\s+/g, ' ').trim(),
  }));

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
