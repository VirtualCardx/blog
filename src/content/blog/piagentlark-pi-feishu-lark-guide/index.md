---
title: "piagentlark 把 pi 编码代理接入飞书，安装方法与权限配置"
description: "piagentlark 通过 RPC 把 pi 编码代理接入飞书和 Lark，支持流式卡片、附件与会话恢复。本文核对源码与安装步骤，记录本地测试结果，并解释用户白名单、工作目录和 PI_APPROVE 的安全边界。"
pubDate: 2026-10-28
updatedDate: 2026-10-28
tags: ["AI Agent", "飞书", "开发工具", "自托管"]
draft: false
---

<p>项目地址 <a href="https://github.com/AdvBuddy/piagentlark" rel="nofollow noopener noreferrer">AdvBuddy/piagentlark</a>。</p>

在飞书里发一句任务，让服务器上的 pi 编码代理接着干活，这就是 piagentlark 要做的事。它把飞书和国际版 Lark 接到 pi 的 RPC 模式，任务仍在你部署桥接器的机器上执行，聊天窗口负责收消息和展示进度。

我核对了 README、配置文件和消息处理代码，也在本地装依赖、跑了测试与构建。本文对应 2026 年 10 月 28 日的提交 `0272045`。这里没有真实飞书应用联调，也没有验证模型回答效果，下面的运行结果只覆盖本地检查。

## 聊天里能看到什么

piagentlark 会把代理的输出更新到飞书卡片里。卡片能展示回答、思考摘要和工具调用状态，还能附带用量信息。任务进行中有停止按钮，长回答超过卡片长度限制后，会拆成后续消息发送。

这种展示适合不想一直守着终端的使用者。你能在手机上查看进度，发 `/stop` 中断任务。代码处理的是模型返回的思考摘要，别把它理解成可以读取模型全部内部推理。

附件也有对应处理。图片和文件可以随消息送进来，配置里能限制数量与体积。默认每条消息最多四张图片，单张上限 8 MiB，文件上限 50 MiB。这些是桥接器自己的默认限制，实际发送还要满足飞书平台的要求。

消息继续到来时，桥接器会处理排队。群聊默认按发言者区分会话，避免所有人共用一份聊天上下文。源码还会保存会话文件映射，重启桥接器后可以接回原来的 pi 会话。

**会话分开不代表文件系统分开。** 多个会话仍可能操作同一个工作目录；若要让不同的人处理互不信任的项目，需要另外安排系统账号或容器。

## 先准备好 pi，再装桥接器

项目 README 要求 pi 至少为 1.4，Node.js 至少为 20.12。安装前，先在目标机器的终端里确认 pi 本身能正常工作，模型认证也已经配置好。桥接器不会替你提供模型账号或免费额度。

按项目推荐方式，在终端执行以下命令。

```bash
pi install git:github.com/AdvBuddy/piagentlark
```

安装后重启 pi 会话，在 pi 终端依次使用下面两个命令。

```text
/lark-setup
/lark-start
```

`/lark-setup` 负责生成创建或更新飞书自建应用的配置链接。你需要在浏览器里打开它，完成授权步骤。当前 README 说明不会自动打开浏览器，SSH 终端会尝试通过 OSC 52 把链接复制到本地剪贴板，终端不支持时直接复制显示出来的链接即可。

扩展方式的配置默认写在 `~/.pi/lark/.env`。`/lark-start` 会启动后台桥接器，连接就绪后再去飞书给机器人发消息。遇到问题，先在 pi 终端查看状态与日志。

```text
/lark
/lark-logs
```

停止和重启分别使用 `/lark-stop`、`/lark-restart`。这组 `/lark-*` 命令属于 pi 终端中的扩展管理命令，与飞书聊天里的 `/stop` 不是一回事。

## 飞书里怎样切换模型和会话

飞书端的命令由 `src/bridge/bridge.ts` 处理，常用的有下面这些。

| 命令 | 用途 |
| --- | --- |
| `/help` | 查看机器人帮助 |
| `/new` | 开始新会话 |
| `/stop` | 中止当前运行 |
| `/status` | 查看会话、模型和用量 |
| `/models` | 列出可用模型，可附关键词过滤 |
| `/model` | 查看当前模型，附模型 ID 时切换 |
| `/thinking` | 查看或调整思考级别 |
| `/compact` | 压缩当前上下文 |
| `/cwd` | 查看或切换工作目录，切换后开始新会话 |
| `/session` | 查看当前 pi 会话文件 |

能选哪些模型，取决于 pi 自己的配置与认证。安装这个项目不会凭空增加可用的模型供应商。

默认使用 WebSocket 长连接，桥接器主动连接飞书，无需给它额外提供公网回调地址。仓库也保留了 webhook 模式；选择该模式时，还要配置回调服务以及验证、加密相关字段。没有回调需求时，先用默认长连接更省事。

## 权限建议在启动前改好

我最关心的是 `FEISHU_ALLOWED_USERS`。这个变量留空时，私聊没有发送者白名单过滤。群聊的默认策略是 `allowlist`，白名单为空时会拒绝群消息。不要看到默认群聊受限，就以为私聊同样关闭了。

个人使用可以从下面这组配置开始。`ou_replace_with_your_open_id` 是占位值，需要换成自己的真实 open_id。

```dotenv
FEISHU_ALLOWED_USERS=ou_replace_with_your_open_id
FEISHU_GROUP_POLICY=disabled
FEISHU_REQUIRE_MENTION=true
FEISHU_ALLOW_BOTS=none
PI_APPROVE=false
```

需要群聊时，再把 `FEISHU_GROUP_POLICY` 改为 `allowlist`，保留用户白名单。`FEISHU_REQUIRE_MENTION` 控制是否必须 @机器人；它不能代替用户授权。

第二处是 `PI_APPROVE`，源码默认值为 `true`。项目明确提醒，这会信任被桥接项目里的 pi 扩展与资源，相关内容可能自动执行。面对不熟悉的代码仓库，先设为 `false` 更稳妥。

**把它改成 false 也不会得到沙箱。** 它控制对项目扩展和资源的信任，不等于全面禁止代理执行命令。文件访问范围仍与运行账号权限、pi 工具配置及工作目录有关。

建议用专门的低权限系统用户运行，工作目录只放准备交给代理的项目。不要把云平台主密钥或其他生产凭据放进这个账号随手就能读到的位置。聊天附件和工具输出同样值得检查，尤其是在多人可见的群里。

## 想单独运行，也有入口

不使用 pi 扩展时，可以按仓库说明独立启动。

```bash
git clone https://github.com/AdvBuddy/piagentlark
cd piagentlark
npm install
npm run setup
npm start
```

这种方式仍然需要可执行的 `pi`。`PI_BIN` 可以指定 pi 路径，`PI_CWD` 指定代理工作目录。没有设置 `PI_CWD` 时，源码会取启动桥接器时的当前目录，第一次运行前尤其要检查这一点。

扩展后台方式把配置和日志等放在 `~/.pi/lark/` 下；直接运行源码时，默认数据目录是启动目录里的 `.pi-lark`。备份会话或排查附件时，要分清自己用的是哪种启动方式。

## 本地检查发现了一个小问题

这次检查环境使用 Node.js 22.23.1，依赖通过 `npm ci --ignore-scripts --no-audit --no-fund` 安装。执行结果如下。

| 检查 | 结果 |
| --- | --- |
| `npm test` | 100 个测试，99 个通过、1 个失败 |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |
| 配置向导 `--help` | 正常输出帮助 |

失败项位于 `tests/inbox.test.ts`，它把项目根目录名写死为 `piclient`。本次检出目录叫 `piagentlark-research`，断言因此失败。这是测试对目录名的依赖，单凭它不能判断飞书消息收发存在故障。

测试里有流式卡片、白名单拒绝和群聊会话隔离等用例，但单元测试通过也不能代替真实平台联调。飞书应用权限有没有开齐、指定模型能否调用，仍要在部署机器上验证。我没有为这篇介绍另建机器人或使用生产凭据。

已经在用 pi、日常又常驻飞书的人，可以从个人私聊试起。先限制能发命令的人，再交给它一个可恢复的小项目。后续是否放到群里，应该等你确认工作目录与权限范围之后再决定。

## 参考材料

<p>安装步骤参考 <a href="https://github.com/AdvBuddy/piagentlark/blob/02720458a8df02e0bdf150a51dc84bd1f5594a52/README.md" rel="nofollow noopener noreferrer">项目 README</a>，配置默认值参考 <a href="https://github.com/AdvBuddy/piagentlark/blob/02720458a8df02e0bdf150a51dc84bd1f5594a52/.env.example" rel="nofollow noopener noreferrer">环境变量示例</a>和 <a href="https://github.com/AdvBuddy/piagentlark/blob/02720458a8df02e0bdf150a51dc84bd1f5594a52/src/config.ts" rel="nofollow noopener noreferrer">配置解析源码</a>。会话与聊天命令核对了 <a href="https://github.com/AdvBuddy/piagentlark/blob/02720458a8df02e0bdf150a51dc84bd1f5594a52/src/bridge/bridge.ts" rel="nofollow noopener noreferrer">消息桥接源码</a>。本地检查结果仅适用于本文记录的提交。</p>
