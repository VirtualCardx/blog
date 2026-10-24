---
title: "Debian 系统无人值守自动更新设置全流程：从安装到配置与测试"
description: "本文介绍 Debian 无人值守自动更新的配置方法，并提醒使用定制内核的 KVM VPS 和云主机注意 Grub 加载失败及内核升级风险。"
pubDate: 2025-02-10
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<aside><p><strong>核验说明（2026-09-15）</strong>：本文包含历史示例或经验性描述。产品资格、价格、配额、网络表现、政策和安全要求可能变化；请以链接的当前官方资料为准，并在生产使用前自行测试与评估。 <a href="https://wiki.debian.org/UnattendedUpgrades" rel="nofollow noopener" target="_blank">官方参考</a>。</p></aside>
<p class="wp-block-paragraph">在 Debian 系统管理中，实现无人值守自动更新能够极大地提升系统维护效率，及时修复安全漏洞，保持系统稳定运行。不过，在操作前有一些重要事项需要特别注意。</p>



<p class="wp-block-paragraph"><mark style="background-color:rgba(0, 0, 0, 0);color:#b83c3c" class="has-inline-color"><strong>对于非物理服务器，尤其是使用定制或修改内核的 KVM 构架 VPS 和云主机，在进行系统升级和内核更新时，存在 Grub 加载失败的风险。所以，务必要提前对重要数据进行备份，以免造成数据丢失。而且，本文中的操作都需要在 root 用户权限下执行，可以通过sudo -i或su root命令来切换到 root 用户。</strong></mark></p>



<h2 class="wp-block-heading">一、安装必备软件</h2>



<ul class="wp-block-list">
<li>首先，运行 <strong><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-contrast-color">apt update</mark></strong> 命令更新软件包列表，确保系统获取到最新的软件包信息。</li>



<li>接着，使用 <strong>apt install unattended-upgrades -y</strong> 命令，安装 <strong>unattended-upgrades</strong>。</li>
</ul>



<pre class="wp-block-code"><code><mark style="background-color:rgba(0, 0, 0, 0);color:#1a411e" class="has-inline-color">user1@debian:~$ sudo apt install unattended-upgrades -y
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  gir1.2-glib-2.0 libgirepository-1.0-1 libglib2.0-0 libglib2.0-data libicu72 libxml2 python3-dbus python3-distro-info
  python3-gi shared-mime-info xdg-user-dirs xz-utils
Suggested packages:
  low-memory-monitor python-dbus-doc bsd-mailx default-mta | mail-transport-agent needrestart powermgmt-base
The following NEW packages will be installed:
  gir1.2-glib-2.0 libgirepository-1.0-1 libglib2.0-0 libglib2.0-data libicu72 libxml2 python3-dbus python3-distro-info
  python3-gi shared-mime-info unattended-upgrades xdg-user-dirs xz-utils
0 upgraded, 13 newly installed, 0 to remove and 0 not upgraded.
Need to get 14.6 MB of archives.
After this operation, 62.1 MB of additional disk space will be used.
Get:1 https://mirrors.aliyun.com/debian bookworm/main amd64 xz-utils amd64 5.4.1-0.2 &#91;471 kB]
Get:2 https://mirrors.aliyun.com/debian bookworm/main amd64 libglib2.0-0 amd64 2.74.6-2+deb12u5 &#91;1,403 kB]
Get:3 https://mirrors.aliyun.com/debian bookworm/main amd64 libgirepository-1.0-1 amd64 1.74.0-3 &#91;101 kB]
Get:4 https://mirrors.aliyun.com/debian bookworm/main amd64 gir1.2-glib-2.0 amd64 1.74.0-3 &#91;159 kB]
Get:5 https://mirrors.aliyun.com/debian bookworm/main amd64 libglib2.0-data all 2.74.6-2+deb12u5 &#91;1,209 kB]
Get:6 https://mirrors.aliyun.com/debian bookworm/main amd64 libicu72 amd64 72.1-3 &#91;9,376 kB]
Get:7 https://mirrors.aliyun.com/debian bookworm/main amd64 libxml2 amd64 2.9.14+dfsg-1.3~deb12u1 &#91;687 kB]
Get:8 https://mirrors.aliyun.com/debian bookworm/main amd64 python3-dbus amd64 1.3.2-4+b1 &#91;95.1 kB]
Get:9 https://mirrors.aliyun.com/debian bookworm/main amd64 python3-distro-info all 1.5+deb12u1 &#91;6,772 B]
Get:10 https://mirrors.aliyun.com/debian bookworm/main amd64 python3-gi amd64 3.42.2-3+b1 &#91;219 kB]
Get:11 https://mirrors.aliyun.com/debian bookworm/main amd64 shared-mime-info amd64 2.2-1 &#91;729 kB]
Get:12 https://mirrors.aliyun.com/debian bookworm/main amd64 unattended-upgrades all 2.9.1+nmu3 &#91;63.3 kB]
Get:13 https://mirrors.aliyun.com/debian bookworm/main amd64 xdg-user-dirs amd64 0.18-1 &#91;54.4 kB]
Fetched 14.6 MB in 14s (1,059 kB/s)</mark></code></pre>



<ul class="wp-block-list">
<li>在安装完成后，<strong>unattended-upgrades</strong> 服务通常会自动启动并生效。</li>



<li>可以通过 <strong>systemctl status unattended-upgrades</strong> 命令查看该服务的运行状态。</li>
</ul>



<pre class="wp-block-code"><code><mark style="background-color:rgba(0, 0, 0, 0);color:#255224" class="has-inline-color">user1@debian:~$  systemctl status unattended-upgrades
● unattended-upgrades.service - Unattended Upgrades Shutdown
     Loaded: loaded (/lib/systemd/system/unattended-upgrades.service; enabled; preset: enabled)
     Active: active (running) since Mon 2025-02-10 09:20:16 EST; 3min 56s ago
       Docs: man:unattended-upgrade(8)
   Main PID: 12444 (unattended-upgr)
      Tasks: 2 (limit: 9474)
     Memory: 13.5M
        CPU: 256ms
     CGroup: /system.slice/unattended-upgrades.service
             └─12444 /usr/bin/python3 /usr/share/unattended-upgrades/unattended-upgrade-shutdown --wait-for-signal</mark></code></pre>



<ul class="wp-block-list">
<li>要是服务没有生效，执行 <strong>systemctl enable &#8211;now unattended-upgrades</strong> 命令，让它立即生效并且设置为开机自启。</li>
</ul>



<pre class="wp-block-code"><code><mark style="background-color:rgba(0, 0, 0, 0);color:#205c23" class="has-inline-color">user1@debian:~$ sudo systemctl enable --now unattended-upgrades
Synchronizing state of unattended-upgrades.service with SysV service script with /lib/systemd/systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable unattended-upgrades</mark></code></pre>



<h2 class="wp-block-heading">二、配置 50unattended-upgrades 文件</h2>



<p class="wp-block-paragraph">接下来，对 <strong>/etc/apt/apt.conf.d/50unattended-upgrades</strong> 文件进行编辑配置，可以参考以下内容：</p>



<pre class="wp-block-code"><code><mark style="background-color:rgba(0, 0, 0, 0);color:#1a3d1f" class="has-inline-color">#nano /etc/apt/apt.conf.d/50unattended-upgrades

APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1"; 
APT::Periodic::Verbose "1";
APT::Periodic::AutocleanInterval "7";

Unattended-Upgrade::Mail "root";

Unattended-Upgrade::Origins-Pattern {
  "origin=Debian,codename=\${distro_codename},label=Debian";
  "origin=Debian,codename=\${distro_codename},label=Debian-Security";
  "origin=Debian,codename=\${distro_codename}-security,label=Debian-Security";
};

Unattended-Upgrade::Package-Blacklist {
};

Unattended-Upgrade::Automatic-Reboot "false";</mark><mark style="background-color:rgba(0, 0, 0, 0);color:#37c291" class="has-inline-color">
</mark></code></pre>



<p class="wp-block-paragraph">然后重启服务：</p>



<pre class="wp-block-code"><code><mark style="background-color:rgba(0, 0, 0, 0);color:#0c562b" class="has-inline-color"># systemctl restart unattended-upgrades</mark></code></pre>



<p class="wp-block-paragraph">上述配置中：</p>



<ul class="wp-block-list">
<li>下面对这些配置项进行详细解释：</li>



<li><strong>APT::Periodic::Update-Package-Lists</strong> 和 <strong>APT::Periodic::Unattended-Upgrade</strong> 这两个配置项，当值设为 “1” 时，表示开启自动更新功能；若设为 “0”，则会关闭自动更新。</li>



<li><strong>APT::Periodic::AutocleanInterval </strong>&#8220;7&#8221;; 意味着系统会将残留的无用依赖包保留 7 天，7 天后自动进行清理，以释放磁盘空间。</li>



<li><strong>Unattended-Upgrade::Origins-Pattern</strong> 用于指定需要更新的 apt 源。默认情况下，仅会更新包含debian和debian-security的仓库。要是想更新第三方源，可以添加自定义的origin。例如，若要更新 PowerDNS 源，添加origin=PowerDNS。其中，origin的值可以从软件仓库的Release文件中获取。</li>



<li><strong>Unattended-Upgrade::Package-Blacklist</strong> 是用来设置软件包黑名单的。在这个名单中的软件将不会被自动更新，并且支持使用正则表达式。比如，设置&#8221;linux-&#8220;，就可以阻止所有以linux-开头的软件包更新；设置&#8221;apache2&#8243;，可以阻止 Apache 2 软件包的更新；设置&#8221;(lib)?xen(store)?&#8221;，则可以阻止包含xen、xenstore以及libxen开头的软件包更新。</li>



<li><strong>APT::Periodic::Verbose &#8220;1&#8221;</strong> 开启了更新进度报告功能，默认值 “0” 表示不发送报告。开启后，能更清楚地了解更新过程。</li>



<li><strong>Unattended-Upgrade::Mail &#8220;root&#8221;;</strong> 表示更新报告邮件会发送给root用户，可根据实际需求修改为其他指定用户。</li>



<li><strong>Unattended-Upgrade::Automatic-Reboot &#8220;false&#8221;; </strong>表示系统在更新后不会自动重启。如果希望更新后自动重启系统，可以将值修改为 “true”。</li>
</ul>



<p class="wp-block-paragraph">完成上述配置后，执行 <strong>systemctl restart unattended-upgrades</strong> 命令重启服务，使新的配置生效。</p>



<h2 class="wp-block-heading">三、测试配置与查看日志</h2>



<p class="wp-block-paragraph">为了确保配置正确，可以运行 <strong>unattended-upgrades &#8211;dry-run &#8211;debug</strong> 命令进行测试。如果没有报错信息出现，那就说明配置是正确的。</p>



<p class="wp-block-paragraph">想要查看更新日志的话，可以使用 <strong>journalctl -u apt-daily.service | tail</strong> 命令。当看到日志中出现 <strong>download updated metadata (success)</strong> .和 <strong>unattended-upgrade -d (success)</strong> 等信息时，就表明自动更新配置已经成功了。按照上述步骤进行操作，就能顺利在 Debian 系统中设置无人值守自动更新，让系统维护更加轻松高效。</p>