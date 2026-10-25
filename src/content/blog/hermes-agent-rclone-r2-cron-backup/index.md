---
title: "Hermes Agent 备份教程：Rclone+R2+Cron"
description: "用 Rclone 把 ~/.hermes 目录加密打包、上传到 Cloudflare R2 对象存储，再用 Linux 系统 Cron 每日自动执行，实现 Hermes Agent 配置、会话与记忆的异地加密备份。包含安全脚本写法、保留策略与新 VPS 完整恢复流程。"
pubDate: 2026-07-24
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<p>Hermes Agent 的配置、会话、记忆、技能和凭据大多放在 <code>~/.hermes</code>。VPS 一旦被封、误删或磁盘损坏，重新安装程序不难，真正麻烦的是把这套长期积累的状态找回来。</p>
<p>下面这套方案用 Rclone 把 <code>~/.hermes</code> 打包、加密并上传到 Cloudflare R2，再交给 Linux 系统的 Cron 每天执行。它不依赖 Hermes 自己的定时任务：即使 Hermes Agent 临时故障，系统 Cron 仍能继续运行备份。</p>
<p><strong>先说两个修正：</strong>不要把加密密码直接写进脚本，也不要用 <code>pkill -f "hermes start"</code> 粗暴结束进程。前者会泄露密码，后者可能杀掉错误进程，而且原方案没有可靠地把 Hermes 重启。</p>
<h2>一、准备 Cloudflare R2</h2>
<p>进入 Cloudflare 控制台，打开 R2 对象存储，完成下面三件事：</p>
<ol>
<li>记录 Cloudflare Account ID。</li>
<li>创建一个私有存储桶，例如 <code>hermes-backup-bucket</code>。</li>
<li>在“管理 R2 API 令牌”中创建令牌，授予目标存储桶的对象读取、写入和删除权限。</li>
</ol>
<p>保存好生成的 Access Key ID 和 Secret Access Key。Secret 只会完整显示一次，不要发到聊天窗口，也不要写入公开仓库。</p>
<h2>二、安装并配置 Rclone</h2>
<p>官方安装脚本适合 Debian、Ubuntu 等常见 Linux 发行版：</p>
<pre><code>curl -fsSL https://rclone.org/install.sh | sudo bash
rclone version</code></pre>
<p>如果不想执行网络脚本，也可以通过系统包管理器安装，但仓库里的版本可能偏旧。</p>
<p>启动交互式配置：</p>
<pre><code>rclone config</code></pre>
<p>按下面的值填写。Rclone 不同版本的菜单编号可能变化，所以应看选项名称，不要死记数字。</p>
<ol>
<li>选择 <code>n</code> 新建 remote，名称填写 <code>cf_r2</code>。</li>
<li>存储类型选择 <code>s3</code>。</li>
<li>Provider 选择 <code>Cloudflare</code>。</li>
<li>填写 Access Key ID 和 Secret Access Key。</li>
<li>Endpoint 填写 <code>https://&lt;ACCOUNT_ID&gt;.r2.cloudflarestorage.com</code>，把占位符换成真实 Account ID。</li>
<li>Region 保持 <code>auto</code> 或留空；ACL 保持 <code>private</code>。</li>
<li>保存配置并输入 <code>q</code> 退出。</li>
</ol>
<p>测试连接：</p>
<pre><code>rclone lsd cf_r2:
rclone lsf cf_r2:hermes-backup-bucket</code></pre>
<p>第一条命令能列出存储桶，第二条没有报错，就说明认证和桶权限正常。</p>
<h2>三、单独保存加密密码</h2>
<p>创建只允许当前用户读取的密码文件。下面的示例字符串必须替换，建议使用密码管理器生成至少 24 位随机密码。</p>
<pre><code>mkdir -p "$HOME/.config/hermes-backup"
umask 077
printf '%s\n' '请替换为你自己的长随机密码' \
  &gt; "$HOME/.config/hermes-backup/passphrase"
chmod 600 "$HOME/.config/hermes-backup/passphrase"</code></pre>
<p>这个密码文件不能放进 <code>~/.hermes</code>，否则恢复时会陷入“没有密码就打不开包含密码的备份”这个死循环。请把密码再保存一份到本地密码管理器或离线介质。</p>
<h2>四、创建安全版备份脚本</h2>
<p>脚本建议放在当前用户目录，而不是直接写进 <code>/opt</code>。这样不需要让普通备份任务持有 root 权限。</p>
<pre><code>mkdir -p "$HOME/bin"
nano "$HOME/bin/hermes-r2-backup.sh"</code></pre>
<p>粘贴以下完整脚本：</p>
<pre><code>#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"
REMOTE_NAME="cf_r2"
BUCKET_PATH="hermes-backup-bucket/hermes-agent"
RETENTION_DAYS=30
HERMES_DIR="${HERMES_HOME:-$HOME/.hermes}"
PASSWORD_FILE="$HOME/.config/hermes-backup/passphrase"
LOCK_FILE="${TMPDIR:-/tmp}/hermes-r2-backup.lock"

command -v rclone &gt;/dev/null || { echo "rclone 未安装"; exit 1; }
command -v openssl &gt;/dev/null || { echo "openssl 未安装"; exit 1; }
[[ -d "$HERMES_DIR" ]] || { echo "目录不存在: $HERMES_DIR"; exit 1; }
[[ -s "$PASSWORD_FILE" ]] || { echo "密码文件不存在: $PASSWORD_FILE"; exit 1; }

exec 9&gt;"$LOCK_FILE"
flock -n 9 || { echo "已有备份任务正在运行，本次退出"; exit 0; }

DATE_TAG="$(date -u +%Y%m%d_%H%M%S)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/hermes-backup.XXXXXX")"
BACKUP_FILE="$TMP_DIR/hermes_${DATE_TAG}.tar.gz.enc"
REMOTE_DIR="${REMOTE_NAME}:${BUCKET_PATH}"
GATEWAY_WAS_ACTIVE=0

cleanup() {
  rc=$?
  rm -rf -- "$TMP_DIR"
  if [[ "$GATEWAY_WAS_ACTIVE" -eq 1 ]]; then
    hermes gateway start &gt;/dev/null 2&gt;&amp;1 || true
  fi
  exit "$rc"
}
trap cleanup EXIT INT TERM

# 官方 gateway 服务运行时先正常停止，避免复制写入中的 SQLite 数据库。
if command -v systemctl &gt;/dev/null \
  &amp;&amp; systemctl --user is-active --quiet hermes-gateway.service; then
  GATEWAY_WAS_ACTIVE=1
  hermes gateway stop
fi

# -C 很重要：归档内保存的是 .hermes/...，恢复时不会多出 home/user 目录。
tar -C "$(dirname "$HERMES_DIR")" -czf - "$(basename "$HERMES_DIR")" \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
      -pass "file:$PASSWORD_FILE" -out "$BACKUP_FILE"

# copyto 明确指定远端文件名，避免路径歧义。
rclone copyto "$BACKUP_FILE" "$REMOTE_DIR/$(basename "$BACKUP_FILE")" \
  --s3-no-check-bucket

# 回读远端对象；失败时脚本返回非零，不会把“上传失败”当成成功。
rclone lsf "$REMOTE_DIR" --files-only | grep -Fx "$(basename "$BACKUP_FILE")" &gt;/dev/null

# 删除超过保留期的旧文件，并清理空目录。
rclone delete "$REMOTE_DIR" --min-age "${RETENTION_DAYS}d"
rclone rmdirs "$REMOTE_DIR" --leave-root

printf 'Backup %s finished: %s\n' "$DATE_TAG" "$(basename "$BACKUP_FILE")"</code></pre>
<p>保存后赋予执行权限：</p>
<pre><code>chmod 700 "$HOME/bin/hermes-r2-backup.sh"</code></pre>
<p>先手动执行一次：</p>
<pre><code>"$HOME/bin/hermes-r2-backup.sh"
rclone lsl cf_r2:hermes-backup-bucket/hermes-agent</code></pre>
<p>看到以 <code>hermes_年月日_时间.tar.gz.enc</code> 命名的对象，才算完成第一次验证。</p>
<h2>五、设置每日 Cron</h2>
<p>编辑当前 Hermes 用户的 crontab，不要用 root 的 crontab，否则 <code>$HOME</code>、Rclone 配置和 Hermes 目录都会指向错误用户。</p>
<pre><code>crontab -e</code></pre>
<p>每天凌晨 2 点运行：</p>
<pre><code>0 2 * * * "$HOME/bin/hermes-r2-backup.sh" &gt;&gt; "$HOME/.hermes/hermes_backup.log" 2&gt;&amp;1</code></pre>
<p>每 12 小时运行一次：</p>
<pre><code>0 */12 * * * "$HOME/bin/hermes-r2-backup.sh" &gt;&gt; "$HOME/.hermes/hermes_backup.log" 2&gt;&amp;1</code></pre>
<p>检查任务和日志：</p>
<pre><code>crontab -l
tail -n 100 "$HOME/.hermes/hermes_backup.log"</code></pre>
<p>这里用的是 Linux 系统 Cron，不是 <code>hermes cron</code>。备份属于灾难恢复基础设施，应该尽量独立于被备份的应用。</p>
<h2>六、新 VPS 上完整恢复</h2>
<p>新机器先安装 Hermes Agent、Rclone 和 OpenSSL，再重新配置同名的 <code>cf_r2</code> remote。不要直接运行 <code>hermes setup</code> 覆盖旧配置。</p>
<pre><code>curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
curl -fsSL https://rclone.org/install.sh | sudo bash
rclone config</code></pre>
<p>创建密码文件，并填入备份时使用的同一个密码：</p>
<pre><code>mkdir -p "$HOME/.config/hermes-backup"
umask 077
printf '%s\n' '你的原加密密码' \
  &gt; "$HOME/.config/hermes-backup/passphrase"
chmod 600 "$HOME/.config/hermes-backup/passphrase"</code></pre>
<p>自动找出时间戳最新的备份并下载：</p>
<pre><code>REMOTE_DIR="cf_r2:hermes-backup-bucket/hermes-agent"
LATEST="$(rclone lsf "$REMOTE_DIR" --files-only | sort | tail -n 1)"
[[ -n "$LATEST" ]] || { echo "没有找到备份"; exit 1; }
rclone copyto "$REMOTE_DIR/$LATEST" "$HOME/$LATEST"</code></pre>
<p>解密到临时目录并检查结构：</p>
<pre><code>RESTORE_DIR="$(mktemp -d)"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -pass "file:$HOME/.config/hermes-backup/passphrase" \
  -in "$HOME/$LATEST" -out "$RESTORE_DIR/hermes.tar.gz"

tar -xzf "$RESTORE_DIR/hermes.tar.gz" -C "$RESTORE_DIR"
test -f "$RESTORE_DIR/.hermes/config.yaml"
ls -la "$RESTORE_DIR/.hermes"</code></pre>
<p>确认目录无误后再替换。先保留当前目录，出错时还能回滚：</p>
<pre><code>hermes gateway stop || true
[[ -d "$HOME/.hermes" ]] \
  &amp;&amp; mv "$HOME/.hermes" "$HOME/.hermes.before-restore-$(date +%s)"
mv "$RESTORE_DIR/.hermes" "$HOME/.hermes"
chmod -R go-rwx "$HOME/.hermes"

hermes doctor
hermes gateway start
hermes gateway status</code></pre>
<p>恢复后检查模型凭据、Telegram/Discord 等频道、Cron 任务和技能是否正常。系统 crontab 与 Rclone 配置不在 <code>~/.hermes</code> 中，所以新机上仍需重新配置。</p>
<h2>七、上线前必须做的四个测试</h2>
<ol>
<li><strong>上传测试：</strong>手动运行脚本并在 R2 中确认对象大小不是 0。</li>
<li><strong>解密测试：</strong>下载一份备份，在临时目录解密并确认能看到 <code>.hermes/config.yaml</code>。</li>
<li><strong>Cron 测试：</strong>临时把计划改为几分钟后执行，确认非交互环境下也能找到 rclone 和 Hermes。</li>
<li><strong>恢复演练：</strong>至少在另一台测试机完整恢复一次。没有做过恢复演练的备份，只能算“可能有用”。</li>
</ol>
<p>R2 端还可以设置生命周期规则作为第二道保留策略。无论是否启用云端自动清理，都建议每月下载一份到本地硬盘。R2 解决的是 VPS 单点故障，本地副本则防止账号、令牌或云存储本身出现问题。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://rclone.org/s3/#cloudflare-r2" target="_blank" rel="noopener nofollow">Rclone：Cloudflare R2 配置文档</a></li>
<li><a href="https://developers.cloudflare.com/r2/" target="_blank" rel="noopener nofollow">Cloudflare R2 官方文档</a></li>
<li><a href="https://hermes-agent.nousresearch.com/docs/reference/cli-commands" target="_blank" rel="noopener nofollow">Hermes Agent CLI 命令参考</a></li>
<li><a href="https://hermes-agent.nousresearch.com/docs/user-guide/messaging/" target="_blank" rel="noopener nofollow">Hermes Agent Gateway 文档</a></li>
</ul>
<hr>
<h2>2026 更新：备份、恢复与凭据边界</h2><p>先确定实际 Hermes Home：默认通常是 <code>~/.hermes</code>，但 <code>HERMES_HOME</code> 或 profile 会改变位置；备份脚本应读取环境变量而不是硬编码路径。备份应覆盖配置、会话/状态库、技能、cron 定义和必要的自建数据；不要把明文 API 密钥、R2 access key 或加密口令提交到仓库、日志或远端脚本。</p><p>采用 3-2-1 思路：至少一份本地、一个独立存储介质和一份异地副本。对归档启用客户端加密，密钥或恢复密码另存于密码管理器/离线介质；R2 bucket 保持私有并使用仅限该 bucket 的最小权限 token。每月在隔离目录做一次恢复演练，并用 <code>hermes doctor</code>、<code>hermes config path</code> 与实际会话/技能读取验证恢复结果。不要为备份而粗暴 kill 运行中的 Hermes 进程。</p><p><strong>资料：</strong><a href="https://rclone.org/s3/#cloudflare-r2">rclone Cloudflare R2</a>；<a href="https://developers.cloudflare.com/r2/">Cloudflare R2 文档</a>；<a href="https://hermes-agent.nousresearch.com/docs">Hermes Agent 文档</a>。</p>