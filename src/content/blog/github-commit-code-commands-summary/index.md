---
title: "Github提交代码方法总结"
description: "Github提交代码方法总结完整指南，从环境配置到提交推送全覆盖，适合开发新手快速掌握Git工作流。"
pubDate: 2025-12-02
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---<p class="wp-block-paragraph">
<h2 class="wp-block-heading" id="github-">1. 初始操作</h2>
<pre class="wp-block-code"><code>echo "# supereditor" &gt;&gt; README.md

git init #初始化仓库

git add README.md #添加单个文件 省略后面的文件名是添加所有文件

git config --global user.name xxx #配置git

git commit -m "first commit" #将暂存区的更改提交到本地仓库，并附加提交说明

git branch -M main #将当前所在分支或指定分支强制重命名为 main

git remote add origin https://github.com/xxx/xxx.git #首次关联远程仓库

git push -u origin main #推送代码</code></pre>
<h2 class="wp-block-heading" id="2-">2. 如何设置代理访问Github</h2>
<h4 class="wp-block-heading" id="-">全局代理设置</h4>
<pre class="wp-block-code"><code>git config --global http.proxy http://127.0.0.1:1080

git config --global https.proxy https://127.0.0.1:1080</code></pre>
<h4 class="wp-block-heading" id="-github-">只对GitHub进行代理</h4>
<pre class="wp-block-code"><code>git config --global http.https://github.com.proxy https://127.0.0.1:1080

git config --global https.https://github.com.proxy https://127.0.0.1:1080</code></pre>
<h4 class="wp-block-heading" id="sock5-">sock5代理设置</h4>
<pre class="wp-block-code"><code>git config --global http.https://github.com.proxy socks5://127.0.0.1:1086

git config --global https.https://github.com.proxy socks5://127.0.0.1:1086</code></pre>
<h4 class="wp-block-heading" id="-">取消代理</h4>
<pre class="wp-block-code"><code>git config --global --unset http.https://github.com.proxy

git config --global --unset http.https://github.com.proxy</code></pre>
<h4 class="wp-block-heading" id="-">查看已有配置</h4>
<pre class="wp-block-code"><code>git config --global -l</code></pre>
<hr />
<section id="vcx-seo-expansion-20260704">
<h2>Github提交代码方法总结：实操前的检查清单</h2>
<p>技术教程类内容最怕照抄命令却忽略环境差异。不同系统版本、Web服务器、插件组合、权限设置都会影响最终结果。操作前建议先记录当前配置，必要时做快照或备份。这样即使步骤出错，也能快速回滚。</p>
<h3>操作前建议确认</h3>
<ul>
<li><strong>系统和软件版本：</strong>确认 Windows、Debian、Nginx、Apache、WordPress 或相关工具版本。</li>
<li><strong>权限：</strong>涉及凭据、证书、配置文件时，先确认当前用户是否有足够权限。</li>
<li><strong>备份：</strong>修改配置文件前先复制一份原文件，WordPress站点建议同时备份数据库。</li>
<li><strong>测试方式：</strong>每改一步就验证一次，不要等全部改完才排查问题。</li>
</ul>
<h3>排错思路</h3>
<p>遇到报错时，先看错误发生在哪一层：浏览器、DNS、服务器、应用、插件还是权限。把问题拆小，比反复搜索一整段报错更有效。对于 WordPress、Nginx、证书、代理这类问题，日志通常比前台页面更可靠。</p>
<p>如果教程中的路径或菜单与你的环境不一致，优先以当前系统显示为准，再根据关键词定位相同功能。尤其是 Windows 控制面板、WordPress 插件菜单和云服务控制台，经常会因版本更新而调整入口。</p>
<h3>后续维护建议</h3>
<p>完成一次修复不代表问题永久消失。建议把关键命令、修改过的文件、修改时间和验证结果记录下来。后续迁移服务器、升级插件或换主题时，这些记录能节省大量排查时间。</p>

</section>
<hr>
<h2>2026 提交前最小安全流程</h2><ol><li><code>git status</code>：确认仅包含预期文件；不要用无差别 <code>git add .</code>。</li><li><code>git diff --check</code> 和项目测试：检查空白错误并运行适用测试。</li><li><code>git add -- &lt;文件&gt;</code>，再用 <code>git diff --cached</code> 审阅将提交的内容。</li><li>使用清晰提交信息，例如 <code>fix: correct sitemap redirect handling</code>；提交后 <code>git show --stat</code> 复核。</li><li>推送前确认 remote 和分支；启用 secret scanning/pre-commit 检查。若误提交密钥，先撤销/轮换，不能只删除最新提交中的文本。</li></ol><p>提交是可审计变更，不是备份替代品；重写共享分支历史前需协调所有协作者。</p><p><strong>官方资料：</strong><a href="https://docs.github.com/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository">GitHub sensitive-data guidance</a>。</p>