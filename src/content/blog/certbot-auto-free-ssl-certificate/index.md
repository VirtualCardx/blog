---
title: "使用certbot自动申请免费证书"
description: "教程介绍在 Debian、Ubuntu 或 RPM 系发行版中用 Python 虚拟环境安装 Certbot 与 Nginx 插件，自动签发或仅获取证书，配置定时续订并检查 HTTPS 和更新账户邮箱。"
pubDate: 2025-02-06
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<h2>2026 Certbot：使用当前官方安装路径并验证续期</h2><p>不要复制过时的 pip/virtualenv 安装步骤或手工添加未经验证的 cron。先到 <a href="https://certbot.eff.org/instructions">Certbot Instructions</a> 选择实际操作系统和 Web 服务器；Certbot 当前文档建议优先使用该系统对应的安装方式。HTTP-01 验证需要域名解析到此服务器且 80 端口可达；通配符证书通常需要 DNS-01 与 DNS provider 凭据。</p><p>对 Nginx，先备份并运行 <code>sudo nginx -t</code>，再使用适配当前安装的 <code>sudo certbot --nginx -d example.com -d www.example.com</code>；只申请不自动改配置时用 <code>certonly</code> 和明确的 authenticator。确认现有的 systemd timer 或 package 自动续期机制后，执行 <code>sudo certbot renew --dry-run</code>。不要在未理解原配置的情况下删除已有 Certbot 包或覆盖续期计划。</p><p>证书、私钥和 DNS API token 均应最小权限保存；续期后监控证书到期日与 HTTPS 探测，而不是只相信 cron 输出。</p><p><strong>官方资料：</strong><a href="https://eff-certbot.readthedocs.io/en/stable/install.html">Certbot installation</a>；<a href="https://eff-certbot.readthedocs.io/en/stable/using.html">Certbot user guide</a>。</p>