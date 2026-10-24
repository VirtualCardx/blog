---
title: "Apache下https反向代理Uvicorn"
description: "详细讲解在Apache服务器下配置HTTPS反向代理Uvicorn的完整教程。通过mod_proxy模块映射本地端口，为您的Python Web项目提供安全服务。"
pubDate: 2025-03-31
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<aside><p><strong>核验说明（2026-09-15）</strong>：本文包含历史示例或经验性描述。产品资格、价格、配额、网络表现、政策和安全要求可能变化；请以链接的当前官方资料为准，并在生产使用前自行测试与评估。 <a href="https://httpd.apache.org/docs/current/mod/mod_proxy.html" rel="nofollow noopener" target="_blank">官方参考</a>。</p></aside>
<h2>Apache 为 Uvicorn 提供 HTTPS 反向代理</h2><p>生产环境让 Uvicorn 仅监听 <code>127.0.0.1</code>，由 Apache 终止 TLS；不要使用 <code>--reload</code>，不要公开后端端口，也不要关闭上游证书验证。</p><pre><code>ProxyRequests Off
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
ProxyPass / http://127.0.0.1:8000/
ProxyPassReverse / http://127.0.0.1:8000/</code></pre><p>启用需要的 proxy/ssl/headers 模块，先运行 <code>apachectl configtest</code>，再平滑重载。</p>