---
title: "Fibocom L850-GL 手动搜网选网工具 l850-cops：解锁 Windows MBIM 下灰色按钮，AT 直控 4G 模组"
description: "Windows MBIM 下 L850-GL 手动搜网按钮灰掉？开源 Rust 工具 l850-cops：释放被联想服务独占的 AT 串口，AT+COPS 直控搜网/锁运营商，GUI+CLI，MIT 开源。"
pubDate: 2026-10-20
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<p>不少商务笔记本（ThinkPad X1 Carbon Gen 9、X13 等一代机型）内置的是广和通 Fibocom L850-GL M.2 4G 模组（Intel XMM 7360 基带）。这颗模组上网本身没问题，但有一个长期困扰用户的小毛病：Windows 原生「手机网络」设置在 MBIM 驱动模式下<strong>不支持手动搜网/选网</strong>，选项直接灰掉。插了境外 SIM 想手动锁定当地运营商？界面上根本没有入口。我们为此开源了一个免费小工具 <strong>l850-cops</strong>（项目地址见文末），用 AT 串口直发 3GPP 标准指令解决这个问题。</p>
<h2>为什么 Windows 上「手动搜网」是灰的</h2>
<p>这里有两层原因，都被这个工具逐一处理：</p>
<ul>
<li><strong>MBIM 模式的限制</strong>：Windows 蜂窝栈走 MBIM 协议时，手动选网能力取决于驱动向系统上报的能力位。L850-GL 的 MBIM 驱动没有开放这一项，设置页的按钮就是灰的——不是 bug，是能力协商结果。</li>
<li><strong>AT 串口被独占</strong>：就算想绕过界面直接发 <code>AT+COPS</code>，L850-GL 的 AT 口（通常是 COM5/COM6）也被联想 SIM 锁服务（<code>ModemAuthenticatorService</code>）、DPR 服务和 Intel ModemControl 设备（MI_04，WUDFRd UMDF 驱动）三方占住，任何程序打开都报「拒绝访问」。这是作者用 handle.exe 逐个排查权限后定位到的根因。</li>
</ul>
<h2>l850-cops 做了什么</h2>
<p>工具用 Rust 编写，一条链路解决两件事：</p>
<ol>
<li><strong>释放串口</strong>：提权后停用联想 SIM 锁/DPR 服务并禁用 Intel ModemControl 设备——注意这只影响管理通道，MBIM 蜂窝上网完全不受影响，事后可一键恢复；</li>
<li><strong>AT 直控选网</strong>：<code>AT+COPS=?</code> 扫描当前全部蜂窝网络（表格列出运营商、PLMN、制式，当前驻留网络高亮），<code>AT+COPS=1,2,"PLMN"</code> 手动锁定运营商，配置持久写入模组、断电不丢。</li>
</ol>
<p>另有模组状态面板（SIM、注册状态、漫游、信号 dBm 分级）、恢复自动选网（<code>AT+COPS=0</code>）、锁定制式（<code>AT+XACT</code>，可仅 LTE / 仅 3G，广和通私有指令）等功能，内置新加坡 M1/Singtel/StarHub、中国大陆三大运营商、港澳台常见 PLMN 识别。</p>
<h2>GUI 和 CLI 两种用法</h2>
<p>双击 <code>l850-cops.exe</code> 启动图形界面（iced GUI），内嵌管理员清单，整个流程只弹一次 UAC；界面按步骤引导：释放串口 → 探测串口 → 查看状态 → 搜网/选网。</p>
<p>喜欢命令行的可以直接用子命令：</p>
<pre>l850-cops detect [过滤词]                  探测串口，找出模组 AT 口
l850-cops free                             释放被独占的 AT 口（提权）
l850-cops restore                          恢复 ModemControl 与联想服务
l850-cops --port COM7 scan                 手动搜网（最长 180 秒）
l850-cops --port COM7 status               查看选网/注册/信号状态
l850-cops --port COM7 select M1            手动锁定运营商（名称或 PLMN）
l850-cops --port COM7 auto                 恢复自动选网
l850-cops --port COM7 mode lte             锁定制式（lte/3g/auto）</pre>
<p>不带 <code>--port</code> 时自动探测串口，波特率 115200 8N1 无流控。构建只需 Rust 1.75+，<code>cargo build --release</code> 即可。</p>
<h2>典型场景</h2>
<ul>
<li><strong>跨境差旅锁网</strong>：到新加坡插当地 SIM，手动锁定 M1（PLMN 52503）避免漫游到贵价网络；回国换卡同理（移动 46000 / 联通 46001 / 电信 46003）。</li>
<li><strong>弱信号排查</strong>：信号不稳时锁定制式或切换运营商，配合 dBm 分级判断是覆盖问题还是模组问题。</li>
<li><strong>验证 eSIM/实体卡驻网行为</strong>：结合我们此前的<a href="/2025/09/26/esim-exit-ip-guide/">eSIM 出口 IP 指南</a>，可以精确控制模组注册到哪个网络再观察出口。</li>
</ul>
<h2>注意事项</h2>
<ul>
<li>手动锁定会持久写入模组，换卡/换地区前记得用「恢复自动选网」还原；</li>
<li>锁定后注册失败（<code>+CME ERROR 30</code>）说明信号太弱或该网不可用，换位置重试；</li>
<li>「释放串口」禁用 ModemControl 只影响管理通道，蜂窝数据走 MBIM 不受影响，可随时 restore；</li>
<li>仅适用于 L850-GL（XMM 7360）。其他 Fibocom 模组的 AT 口占用结构可能不同。</li>
</ul>
<h2>项目地址</h2>
<p><a href="https://github.com/VirtualCardx/Fibocom-L850-GL-M.2-4G" rel="noopener">https://github.com/VirtualCardx/Fibocom-L850-GL-M.2-4G</a>（MIT 开源，Rust 源码 + 发布产物）。仓库同时记录了 COM 口被独占的完整排查过程，对做 Windows 硬件驱动调试的人也有参考价值。</p>