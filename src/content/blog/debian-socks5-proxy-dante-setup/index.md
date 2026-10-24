---
title: "Debian 下配置 Socks5 代理服务端软件 dante"
description: "教程说明如何在 Debian 安装 dante，配置网卡、1080 端口、用户名认证和可选 IP 限制，再开放防火墙、重启服务，并通过 curl 或浏览器验证 Socks5 代理。"
pubDate: 2025-06-11
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<aside><p><strong>核验说明（2026-09-15）</strong>：本文包含历史示例或经验性描述。产品资格、价格、配额、网络表现、政策和安全要求可能变化；请以链接的当前官方资料为准，并在生产使用前自行测试与评估。 <a href="https://manpages.debian.org/testing/dante-server/danted.8.en.html" rel="nofollow noopener" target="_blank">官方参考</a>。</p></aside>
<h2>Debian 上安全部署 Dante SOCKS5</h2><p>仅供固定、已授权客户端使用；不要运行公共代理。先在云和主机防火墙只允许固定管理 IP 访问 1080/TCP。</p><pre><code>socksmethod: username
clientmethod: none
client pass { from: 203.0.113.10/32 to: 0.0.0.0/0 }
socks pass { from: 203.0.113.10/32 to: 0.0.0.0/0 command: connect }</code></pre><p>替换示例 IP，并按已安装版本验证配置；记录日志、定期更新和轮换凭据。</p>