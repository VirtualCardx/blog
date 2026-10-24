---
title: "Nginx 下 Rank Math Sitemap 设置"
description: "在Nginx服务器中使用Rank Math SEO插件生成Sitemaps报错？本文详解Nginx伪静态规则的额外设置方法，轻松解决Sitemap无法访问的问题。"
pubDate: 2025-02-10
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<p class="wp-block-paragraph">Rank Math 会动态创建一个sitemap，它依赖于在服务器级别使用重定向。在某些情况下，如果您的网站地图没有按预期运行，您需要手动添加一些重写规则。</p>



<p class="wp-block-paragraph">为确保您需要添加这些重写规则，请访问 domain.com?sitemap=1。</p>



<figure class="gb-block-image gb-block-image-84b647da"><img src="./imgs/img24.png" alt="在 Rank Math 中检查sitemap生成情况" width="1091" height="524" loading="lazy"></figure>



<p class="wp-block-paragraph">如果sitemap加载成功，则说明 Rank Math SEO 能够成功生成sitemap，但无法将sitemap重写到 sitemap_index.xml 页面。</p>



<h2 class="wp-block-heading">修复Nginx服务器上使用Rank Math SEO的sitemap问题</h2>



<p class="wp-block-paragraph">如果 Nginx 服务器阻止了网站地图文件的创建，那么 Rank Math 也会通过sitemap设置下的通知让你知道。在这种情况下，你需要手动添加重写规则。</p>



<figure class="gb-block-image gb-block-image-b496c493"><img src="./imgs/img25.jpg" alt="Nginx 服务器上的rank math sitemap通知" width="1015" height="238" loading="lazy"></figure>



<h2 class="wp-block-heading">1. 在 Nginx 服务器中添加重写规则</h2>



<p class="wp-block-paragraph">因此，请前往 Nginx 配置文件，添加以下重写规则来解决这个问题：</p>



<p class="wp-block-paragraph">修改对应的nginx网站配置文件，一般在/usr/local/nginx/site-enables/xxx 中。</p>



<ul class="wp-block-list">
<li>使用 vim 编辑配置文件</li>



<li>在最末尾的 } 前添加插件的 rewrite 代码</li>



<li>保存文件</li>



<li>使用 systemctl restart nginx 命令重启 Nginx</li>
</ul>



<pre class="wp-block-code"><code>使用 vim 编辑配置文件
在最末尾的 } 前添加插件的 rewrite 代码
保存文件
使用 systemctl restart nginx 命令重启 Nginx</code></pre>



<pre class="wp-block-code"><code># START Nginx Rewrites for Rank Math Sitemaps
rewrite ^/sitemap_index.xml$ /index.php?sitemap=1 last;
rewrite ^/(&#91;^/]+?)-sitemap(&#91;0-9]+)?.xml$ /index.php?sitemap=$1&amp;sitemap_n=$2 last;
rewrite ^/(&#91;a-z]+)?-sitemap\.xsl$ /index.php?xsl=$1 last;
# END Nginx Rewrites for Rank Math Sitemaps</code></pre>



<h2 class="wp-block-heading">2. 清除网站地图设置</h2>



<p class="wp-block-paragraph">添加上述重写规则后，需要刷新网站地图设置。为此，请前往 WordPress 管理区中的 Rank Math SEO → sitemap settings，对 “每个网站地图的链接数 ”做一些小改动。然后点击 “保存更改 ”按钮。</p>



<figure class="gb-block-image gb-block-image-2647d608"><img src="./imgs/img26.jpg" alt="刷新sitemap setting" width="2406" height="918" loading="lazy"></figure>



<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">参考：<a href="https://rankmath.com/kb/xml-sitemaps-nginx/" rel="nofollow noopener" target="_blank">https://rankmath.com/kb/xml-sitemaps-nginx/</a></p>
</blockquote>
<hr>
<h2>2026 Nginx / Rank Math sitemap 验证</h2><p>先访问 <code>/?sitemap=1</code>：若该动态地址成功而 <code>/sitemap_index.xml</code> 失败，才考虑加入 Rank Math 官方的 Nginx rewrite 规则。规则必须放入正在处理该域名的正确 <code>server</code> 块；不要按猜测路径编辑配置。修改前备份并运行 <code>sudo nginx -t</code>，通过后使用 <code>sudo systemctl reload nginx</code>（无需中断式 restart）。</p><p>保存 Rank Math sitemap 设置以刷新缓存，并在应用/CDN 层排除 sitemap 缓存或用低 TTL。最终检查 sitemap index、每个子 sitemap 和抽样 URL：站点地图返回 200、内容为 XML、仅列出可索引 canonical URL；提交的是 index，不必让 sitemap 自身被索引。</p><p><strong>官方资料：</strong><a href="https://rankmath.com/kb/xml-sitemaps-nginx/">Rank Math XML Sitemaps on Nginx</a>；<a href="https://rankmath.com/kb/configure-sitemaps/">Rank Math sitemap configuration</a>。</p>