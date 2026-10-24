---
title: "nginx如何设置IP直接访问自动跳转到域名"
description: "Nginx服务器如何实现IP直接访问自动301跳转到域名？本文提供详细的Nginx配置代码与设置教程，有效集中网站权重并提升SEO表现。"
pubDate: 2025-02-06
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<h2>2026：不要把任意 IP/Host 请求 301 到站点域名</h2><p>直接访问 IP 的 HTTPS 请求在 TLS 握手阶段就可能因没有匹配证书失败，因此“443 默认 server 重定向到域名”不能保证用户能看到跳转。更安全的默认 server 通常是拒绝未知 Host（例如返回 444/400），而不是把任意 Host header 或 IP 请求反射到正式站点，这会扩大 Host-header 风险。</p><p>为正式域名单独设置明确的 HTTP→HTTPS 与 www/non-www canonical 重定向；在变更前用 <code>sudo nginx -t</code>，然后 <code>sudo systemctl reload nginx</code>。测试已知域名的 HTTP/HTTPS、正确 Host、错误 Host 和 IP 请求，并检查最终 canonical、HSTS 及证书是否符合预期。</p><p><strong>资料：</strong><a href="https://nginx.org/en/docs/http/request_processing.html">NGINX request processing</a>；<a href="https://httpd.apache.org/docs/2.4/rewrite/remapping.html">HTTP redirect principles</a>。</p>