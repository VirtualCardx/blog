---
title: "记录一次Google SEO处理过程"
description: "记录一次Google SEO处理过程完整指南，深入分析搜索引擎优化策略、关键词研究技巧与内容创作方法，帮助网站提升Google排名与自然搜索流量。"
pubDate: 2025-05-29
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">2025年5月29日总结想被收录，链接手动提交吧</p>
</blockquote>
<p class="wp-block-paragraph">最近GSC中，页面收录情况极差，刚过50%，如下如所示</p><p class="wp-block-paragraph">情况惨不忍睹，出词也很差，不到14个，我特么上传了70多篇笔记，出了14个词，谷歌你是在侮辱我吗？我是技术人员，这是对我赤裸裸的侮辱，我特么必须搞掉你!</p>
<p class="wp-block-paragraph">据我判断，问题可能主要出在Rank Math SEO插件上，有些项目我可能设置的有问题，特别是那些标注noindex问题的页面</p>
<h2 class="wp-block-heading">一、被“noindex”标记排除</h2><p class="wp-block-paragraph">转到Rank Math SEO插件界面，找到对应选项 Tag Archives Robots Meta</p><p class="wp-block-paragraph">这里有个重要的设置项，先设置成这样是符合要求的，意思是允许tag被google收录，也可以直接关掉</p><p class="wp-block-paragraph">这样默认也是允许收录的</p><p class="wp-block-paragraph">修复完毕，在GSC中执行重新验证，继续下一项</p>
<h2 class="wp-block-heading">二、已抓取 &#8211; 尚未编入索引</h2>
<p class="wp-block-paragraph">这里测试了以下，基本都符合要求，重新执行下验证，过</p>
<h2 class="wp-block-heading">三、已抓取 &#8211; 尚未编入索引</h2>
<p class="wp-block-paragraph">这里有好多老文章，当时时间仓促，写的过短了，有的只有一行链接，已经使用AI重写修复一部分了，过</p>
<h2 class="wp-block-heading">四、网页会自动重定向</h2>
<p class="wp-block-paragraph">重新启动验证</p>
<h2 class="wp-block-heading">五、重定向错误</h2>
<p class="wp-block-paragraph">该错误已经修复，主要是translatepress导致的问题，重新启动验证</p>
<h2 class="wp-block-heading">六、备用网页（有适当的规范标记）</h2>
<p class="wp-block-paragraph">处理方法：无需处理</p>
<p class="wp-block-paragraph">以下内容来自Shopify 社区</p>
<p class="wp-block-paragraph">感谢您使用 Shopify 社区论坛。我是 Shopify 支持团队的工作人员 Gina，很高兴能借由此平台协助您。我了解到您在 Google Search Console 遇到「备用网页（有适当的规范标记）</p>
<p class="wp-block-paragraph">」的提示，我明白此事的重要性。请放心，下面就为您提供更多信息。</p>
<p class="wp-block-paragraph">针对这个提示信息，我为您找到了 “网页索引编制”报告 &#8211; Search Console帮助，其中提到关于备用网页（有适当的规范标记）：</p>
<pre class="wp-block-code"><code>相应网页被标记为另一网页的备用网页（即该备用网页是一个 AMP 网页，它可以是桌面版本的规范网页，或者是桌面版本规范网页的移动版本，还可以是移动版本规范网页的桌面版本）。该网页正确地指向了已编入索引的规范网页，因此您无需执行任何操作。Search Console 不会检测网页的备用语言版本。</code></pre>
<p class="wp-block-paragraph">因此您无需执行任何操作。</p>
<hr />
<section id="vcx-seo-expansion-20260704">
<h2>记录一次Google SEO处理过程：补充说明与使用建议</h2>
<p>这类资源型内容适合收藏，但也需要定期复核。工具、平台、链接和规则都会变化，尤其是免费资源、临时服务、第三方平台，经常会出现失效、改版或限制地区访问的情况。</p>
<h3>使用前建议</h3>
<ul>
<li>先确认链接是否仍然可访问。</li>
<li>优先查看官方说明，不要只依赖二手教程。</li>
<li>涉及账号、邮箱、支付或隐私数据时，不要提交敏感信息。</li>
<li>把可替代方案也保存下来，避免单点失效。</li>
</ul>
<p>如果你是为了长期业务使用，建议选择有稳定维护记录、清晰隐私政策和可联系支持渠道的工具。短期临时需求可以用免费方案，但不要把关键资料长期放在不确定的平台上。</p>

</section>
<hr>
<h2>2026：把 GSC 状态当诊断线索，不是逐项“修复”清单</h2><p>“已抓取，尚未编入索引”没有保证的人工修复按钮。先抽样检查页面是否独特、可访问、可被抓取、返回 200、未 noindex、canonical 指向自己或合理主版本，并有内部链接；随后改善实际内容和站点质量。不要为让标签页或薄聚合页获得索引而一律取消 noindex。</p><p>“替代页面（具有正确的规范页标记）”通常是信息状态：若规范页选择符合预期，无需处理。重定向问题应通过真实 HTTP 链路定位并修复循环、长链或错误目标；修复后使用 URL Inspection 测试关键 URL，并在后续数据周期观察，而不是反复批量提交。</p><p><strong>官方资料：</strong><a href="https://developers.google.com/search/docs/monitor-debug/search-console-start">Search Console 文档</a>；<a href="https://developers.google.com/search/help/crawling-index-faq">Google 索引 FAQ</a>。</p>