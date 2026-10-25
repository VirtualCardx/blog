---
title: "网站迁移不丢流量：301与Sitemap实操指南"
description: "网站迁移后流量归零？以WordPress迁Cloudflare Workers实战为例，讲清301/302选型、URL映射表制作、canonical与sitemap三件套、Bing IndexNow提交与三周观察期。"
pubDate: 2026-08-31
updatedDate: 2026-10-24
tags: ["SEO"]
draft: false
---

<h2>迁移没做好 301，流量掉一半是真的</h2>
<p>2026 年 8 月我们把这个站从 nginx 上的 WordPress 搬到了 Cloudflare Workers，旧文章的 URL 从 <code>/2025/02/10/文章别名/</code> 这种日期结构换成了短路径。搬迁后第一周，Bing 那边来自旧 URL 的点击直接归零——不是慢慢下降，是归零。原因很简单：爬虫还在访问旧地址，拿到的是 404，于是索引里那些页面的权重和展示就停了。</p>
<p>后来我们补了一张 78 条的 301 映射表，逐条验证通过后，Bing 的展示量在两周内回来了大半。这篇文章就把整个过程拆开讲清楚：什么时候必须做 301、映射表怎么做、sitemap 怎么处理、以及 Bing 和 Google 各自的提交通道。不管你是换域名、换 CMS，还是只是改 URL 结构，逻辑都一样。</p>

<h2>先搞清楚：301、302、308 到底用哪个</h2>
<p>很多人以为重定向就是"跳过去"，其实搜索引擎对不同的状态码处理方式完全不同。根据 <a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="nofollow noopener">Google 官方重定向文档</a>（核验日期 2026-09-01）：</p>
<ul>
<li><strong>301 / 308（永久）</strong>：Googlebot 跟随跳转，并且索引管道会把重定向目标当作 canonical（规范网页）的信号。确定不再回退的迁移就用这个。</li>
<li><strong>302 / 307（临时）</strong>：Googlebot 照样跟随，但索引管道<strong>不会</strong>把目标页当 canonical。旧 URL 仍可能留在搜索结果里。临时维护、A/B 测试才用。</li>
<li><strong>meta refresh / JS 跳转</strong>：能被识别，但官方明确说这是没办法时的下策，信号传递不如服务端跳转可靠。</li>
</ul>
<p>一个常被担心的老问题：301 会不会丢 PageRank？Google 文档原话给出了定论——"301 及其他永久重定向不会导致 PageRank 损失"（核验日期 2026-09-01）。所以该做 301 的时候别犹豫，真正的损失来自不做。</p>

<h2>URL 映射表：整个迁移里最值钱的文档</h2>
<p>Google 在<a href="https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes" target="_blank" rel="nofollow noopener">网站迁移指南</a>里把"准备 URL 映射"单独列为一步，我们实操下来深有体会。映射表本质就是两列：旧 URL、新 URL。看着简单，难点在于把旧 URL 收全。</p>
<p>官方建议的旧 URL 来源有五个，按优先级排：</p>
<ol>
<li>旧站的 sitemap——最重要的 URL 基本都在里面；</li>
<li>服务器日志和分析工具——找流量最高的页面；</li>
<li>Search Console 的"指向您网站的链接"——有内外链的页面；</li>
<li>CMS 后台导出的全量 URL 列表；</li>
<li>近期被爬虫访问过的日志 URL。</li>
</ol>
<p>有两个容易漏的点。第一，<strong>图片和视频也算 URL</strong>：WordPress 的 wp-content/uploads 路径、缩略图、OG 图，这些如果换了位置，同样要做跳转，否则图片搜索流量和外链图片会断。第二，映射目标要"一对一"或"多对一收敛"：旧 A 跳新 A'，内容合并的场景允许多个旧页跳到同一个新页，但<strong>绝对不要把一批不相关的旧 URL 全部跳到首页</strong>——Google 明确说这种做法会被当成软 404 处理。</p>

<h2>在哪里做 301：四种常见位置</h2>
<h3>nginx / Apache 配置文件</h3>
<p>自建服务器最直接的方式。nginx 用 <code>return 301</code>，Apache 用 mod_alias 的 <code>Redirect permanent</code> 或 mod_rewrite。优点是执行在服务端最前端，没有性能损耗，信号传递也最干净。我们老站回滚用的 nginx 就是这么配的。</p>
<h3>Cloudflare 侧做跳转</h3>
<p>如果源站在 Cloudflare 后面（我们现在就是这样），可以用 <a href="https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/" target="_blank" rel="nofollow noopener">Bulk Redirects</a>（批量重定向）规则。它的好处是不用碰源站配置，在边缘直接返回 301，还支持 CSV 批量导入几十上百条规则。对 WordPress 迁到 Workers 这种"源站都换了"的场景特别合适。</p>
<h3>CMS / 框架路由内</h3>
<p>WordPress 有 Redirection 插件，新站如果框架支持（比如 Hono、Next.js），也可以在应用路由表里写一段旧路径→新路径的映射逻辑。缺点是每个请求都要过一遍应用代码，规则多了要注意性能。</p>
<h3>什么时候只能用前端兜底</h3>
<p>静态托管拿不到服务端配置时，才退而求其次用 meta refresh 或 JS <code>location</code>。能不用就不用，前面说了，信号传递不可靠。</p>

<h2>重定向链：能一跳就别两跳</h2>
<p>Googlebot 最多跟随 10 跳，但官方建议<strong>直接指向最终目标，链条最好不超过 3 跳、少于 5 跳</strong>。举个实际例子：你先把 /old/ 跳到 /2019/old/，后来又把 /2019/old/ 跳到 /old-page/，这就成了两跳。用户多等一次往返，部分浏览器和爬虫对长链支持也不好。迁移完成后用 curl 把映射表整个跑一遍，确认每条都是一跳直达：</p>
<pre>curl -sIL -o /dev/null -w '%{http_code} %{url_effective}\n' https://example.com/old-url/</pre>
<p>映射表条目多的话，把它存成文本文件逐行循环跑，一次输出全部结果，比手动一条条粘快得多：</p>
<pre>while read u; do curl -sIL -o /dev/null -w '%{http_code} %{url_effective}\n' "$u"; done &lt; old-urls.txt</pre>
<p>输出里凡是出现 200 以外的中间状态码、或者最终落点不是预期新 URL 的，都要回映射表修正后重测。</p>

<h2>canonical、内链与新 sitemap：三件套一起换</h2>
<p>301 生效只是开始，新站这边还有三件事必须同步做：</p>
<ul>
<li><strong>canonical 自引用</strong>：每个新 URL 的页面里放指向自己的 <code>rel="canonical"</code>。迁移期间如果新旧站同时可访问，这一步能帮搜索引擎尽快确定该收录哪个版本。</li>
<li><strong>站内链接全换新</strong>：把新站里还指向旧 URL 的内链全部改掉。让用户和爬虫每次点击都多挨一次 301，既慢又不利于信号传递。</li>
<li><strong>提交新 sitemap，移除旧 sitemap</strong>：新 sitemap 只放最终会返回 200 的 canonical URL，301 跳转路径和已删除内容不要放进去。我们这次迁移后把 sitemap 从 364 条清到 337 条，把旧分类路径全部剔掉，全量审计 337/337 返回 200。</li>
</ul>
<p>顺带说一句多语言站。如果站点有中英两个版本（比如本站 /zh/ 路径和 /en/ 路径），官方建议每个语言用不同 URL，并用 hreflang 注解互相标注。迁移时 hreflang 里的地址也要一并换成新 URL，不然语言匹配会乱。</p>

<h2>Bing 和 Google 的提交通道差异</h2>
<p>这是中文站站长最关心的部分，两家的免费工具链完全不同：</p>
<ul>
<li><strong>Google Search Console</strong>：迁移后提交新 sitemap；如果是换域名，还要在旧站点属性里提交"地址更改"（Change of Address）。同域内的路径迁移不需要这个工具。</li>
<li><strong>Bing Webmaster Tools</strong>：同样支持提交 sitemap，但 Bing 对 IndexNow 的响应比 Google 快得多。IndexNow 是 Bing、Yandex、Seznam 共同支持的协议，你主动 POST 一个 URL 列表，引擎立刻知道哪些 URL 变了，不用等重新抓取。新站没有历史 OAuth 授权的话，IndexNow 就是提交主通道——本站就是这么做的，key 文件放在根目录，POST 到 bing.com/indexnow 和 api.indexnow.org/indexnow 两个端点。</li>
</ul>
<p>Google 目前不支持 IndexNow，它靠 sitemap + 自然重抓。所以双引擎都要照顾的话，两个通道都得做。</p>
<p>另外提醒一个我们踩过的坑：验证线上效果时务必用 IPv4 直连加随机参数（<code>curl -4 "https://example.com/url/?cb=$RANDOM"</code>）。CDN 边缘缓存的旧 HTML 会让你以为 301 没生效，实际上是缓存假阴性。</p>

<h2>迁移后盯什么：三周观察期</h2>
<p>Google 文档给出的预期很实在：中型站点需要几周甚至更久，新 URL 才会逐渐替换旧 URL 出现在搜索结果里；期间排名波动是正常的。我们自己的观察清单：</p>
<ol>
<li><strong>旧 URL 抓取量</strong>：GSC 和 Bing WMT 的爬行统计里，旧 URL 的请求应该逐步下降；</li>
<li><strong>新 URL 索引量</strong>：用 <code>site:</code> 查询和索引覆盖率报告盯新地址的收录进度；</li>
<li><strong>软 404 与 404 报表</strong>：映射漏掉的 URL 会在这里露头，发现一条补一条；</li>
<li><strong>自然点击对比</strong>：按周对比迁移前后搜索流量，三周内恢复到原水平的 70% 以上算健康。</li>
</ol>
<p>官方还建议 <strong>301 至少保留一年</strong>，因为外链信号的转移需要时间，从用户角度考虑甚至可以无限期保留。这条经常被人忽略——服务器一到期就把旧域名跳转下了，前面全白做。</p>

<h2>风险与限制：别把 301 当万能药</h2>
<ul>
<li><strong>301 不传递处罚</strong>是一把双刃剑：如果旧站被算法降权，跳转到新 URL 救不了内容质量本身。迁移前先确认旧站没有手动操作处罚，判断方法可以参考<a href="/blog/how-to-check-if-domain-penalized-by-google/" title="如何判断域名是否被Google惩罚">我们之前的域名惩罚排查文章</a>。</li>
<li><strong>缓存会放大事故</strong>：CDN 和浏览器都会缓存 301（浏览器甚至重启都不一定丢）。规则配错的窗口越短越好，发现错误立刻改，并主动 purge 边缘缓存。</li>
<li><strong>多语言站别偷懒</strong>：只给中文版做 301、英文版 404，等于砍掉一半流量。每个语言版本的映射都要单独进表。</li>
<li><strong>别在迁移同时大改内容</strong>：官方建议一次只变一个东西。又换 URL 又重写标题正文，出了问题你分不清是哪个变量导致的。</li>
</ul>

<h2>常见问题 FAQ</h2>
<h3>301 要保留多久？</h3>
<p>Google 官方建议至少一年，条件允许就一直保留。外链重新指向新 URL 的速度比想象中慢，过早撤掉跳转会浪费还没转移完的信号。</p>
<h3>302 用久了会自动变 301 吗？</h3>
<p>搜索引擎确实可能把长期存在的 302 当永久处理，但这是它们的行为，不是你能控制的。确定永久就明示 301，别让引擎猜。</p>
<h3>网站换 HTTPS，需要 Change of Address 吗？</h3>
<p>不需要。Google 明确说 HTTP→HTTPS、同域 www 与非 www 互跳、同域内路径变化，都不需要提交地址更改；只有跨域名（含子域切换）才用那个工具。</p>
<h3>旧文章删了不迁移，还要做 301 吗？</h3>
<p>不用。官方建议让这些 URL 直接返回 404 或 410。410 语义更明确（资源已永久删除），能帮搜索引擎更快清理索引。把它们 301 到首页反而是软 404。</p>
<h3>做 301 之后多久能看到流量恢复？</h3>
<p>看站点规模。我们这个百来页的站，Bing 展示量两周回来大半；Google 侧官方口径是中型站几周起。期间排名有波动是正常的，别急着回滚。</p>
<h3>sitemap 里要不要放旧 URL？</h3>
<p>不要。sitemap 只放最终返回 200 的 canonical URL。旧 URL 的使命已经交给 301 完成，放进 sitemap 只会浪费抓取预算。</p>

<h2>写在最后</h2>
<p>迁移这件事，技术上不难，难在纪律：映射表要全、验证要逐条跑、观察期要有耐心。我们这次 WordPress→Workers 的迁移之所以能恢复，靠的就是 78 条映射全部验证通过、sitemap 清理到只含 canonical URL、外加 IndexNow 双端点提交。如果你的站也在计划迁移，按这篇文章的顺序走一遍，能把风险压到最低。动手前不妨也看看我们之前整理的<a href="/blog/nginx-wordpress-rank-math-sitemap-config/" title="Nginx 下 Rank Math Sitemap 设置"> nginx 环境下 sitemap 配置</a>和<a href="/blog/cloudflare-workers-free-api-safety-guide/" title="Cloudflare Workers 免费版做 API"> Cloudflare Workers 免费额度实践</a>，两篇正好覆盖迁移前后两端的技术细节。</p>

<hr>
<h2>2026 迁移核验清单</h2><p>上线前先导出旧站可索引 URL、目标 URL、状态码和规范化 URL，并建立<strong>一对一</strong>的永久重定向映射。不要把大量无关旧页或已删除页通配到新首页：没有对应内容的 URL 应返回合理的 404/410，或在新内容就绪后再重定向。</p><ol><li>在预发布环境用真实请求测试每个关键旧 URL：只能有一跳 301/308，目标返回 200、正确 canonical，并保留路径和查询参数的既定规则。</li><li>发布后保留旧域名和重定向至少一年；抓取新旧站点地图，确认站点地图仅含可索引的规范 URL，且每个 URL 返回 200。</li><li>在 Search Console 验证两个资源；跨域名迁移时使用 Change of Address 工具，并提交新站 sitemap。用“网址检查”和效果报告观察，而不是逐页反复请求收录。</li></ol><p><strong>官方资料：</strong><a href="https://developers.google.com/search/docs/monitor-debug/search-console-start">Google Search Console 文档</a>；<a href="https://developers.google.com/search/help/crawling-index-faq">Google 关于 301 与索引的说明</a>。</p>