import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { marked } from 'marked';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import type { APIContext } from 'astro';

// 全文输出：渲染 Markdown 为 HTML；图片改写为指向原文的链接
// （内容图片经 Astro 优化后是哈希地址，RSS 里无法稳定引用，引导读者回站查看）
function renderContent(body: string, postUrl: string) {
  const md = body.replace(/!\[[^\]]*\]\([^)]*\)/g, `[📷 图片](${postUrl})`);
  let html = marked.parse(md, { async: false }) as string;
  const origin = new URL('/', postUrl).href.replace(/\/$/, '');
  html = html.replace(/(href|src)="\//g, `$1="${origin}/`);
  return html;
}

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const origin = context.site!.toString().replace(/\/$/, '');

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      content: renderContent(post.body ?? '', `${origin}/blog/${post.id}/`),
    })),
    customData: `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
  });
}
