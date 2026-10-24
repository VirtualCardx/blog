---
title: "大模型API联网搜索实测（2026）：GPT/Claude/Gemini 谁最稳、最省？"
description: "实测 OpenAI/Claude/Gemini/DeepSeek 联网搜索：谁返回最稳、调用价格最低、接口迁移最省事？横向对比 + 开发者选型建议与避坑。"
pubDate: 2025-07-20
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---<ul class="wp-block-list">
<li><strong>ChatGPT (OpenAI)、Gemini（Google）和 Claude（Anthropic）已正式在 API 层面内置联网搜索</strong>，均以「服务器端检索工具」的形式提供，调用简单、自动返回带引用的实时内容。</li>



<li><strong>DeepSeek-R1 提供了“enable_search”参数，但目前仅在阿里云 <em>LLM API</em> 网关及 OpenSearch 场景下生效，属区域／版本受限的公测能力</strong>。</li>



<li><strong>字节跳动豆包与通义千问暂未在通用 chat-completions API 中开放官方搜索工具</strong>，只能通过 Ark 插件（豆包）或“官网工作流/网页端工具链”（千问）调用，SDK/HTTP 原生接口仍需自行接入外部搜索 API。</li>



<li>各家计费方式差异明显——OpenAI 与 Anthropic按「<em>搜索调用</em>＋<em>生成 token</em>」双计费，Google 采用「$14/千次检索（Gemini 3.x，每月前 5,000 次免费）」单独计价（2026-09 官方定价页核验；旧款 2.5 系列仍为 $35/千次），DeepSeek 在 Quark Search 通道内暂免单独收费。</li>



<li>功能最细致的是 <strong>Claude</strong>：可限制 max_uses、白名单／黑名单域名、本地化 user_location，并支持多轮渐进检索；<strong>Gemini</strong> 则允许动态阈值 retrieval_threshold 控制是否检索；<strong>OpenAI</strong> 提供 search_context_size 选项平衡质量-费用。</li>
</ul>



<h2 class="wp-block-heading">各模型联网搜索能力横向对比</h2>



<figure class="wp-block-table"><table class="has-fixed-layout"><thead><tr><th>模型</th><th>是否内置搜索</th><th>启用方式 / 关键参数</th><th>返回格式 &amp; 引用</th><th>计费策略</th><th>主要限制与备注</th></tr></thead><tbody><tr><td>DeepSeek-R1</td><td>限定公测</td><td><code>enable_search:true</code>（仅 <em>deepseek-r1</em>，需在阿里云 LLM API / OpenSearch 调用）</td><td>摘要＋URL</td><td>暂随深度求索 token 计价，无单独检索费</td><td>依赖夸克搜索，国内可用；其他 DeepSeek 系列暂不支持</td></tr><tr><td>豆包 Doubao</td><td><strong>无通用接口</strong></td><td>在火山方舟 <em>bot/应用</em> 配置“联网插件”，API 侧收到结构化结果 JSON</td><td>自行拼接</td><td>与推理 token 同价；插件流量日 1000 次免费</td><td>仅 Ark 平台可用；OpenAI 兼容 / 直接 REST 暂无法 <code>enable_search</code></td></tr><tr><td>通义千问 Qwen</td><td><strong>无通用接口</strong></td><td>DashScope 网页“工具链”带搜索；API 未开放</td><td>摘要＋URL</td><td>N/A</td><td>用户需自行 RAG 或 Bing/Brave API + 函数调用</td></tr><tr><td>ChatGPT (OpenAI)</td><td>✅</td><td>a) Chat Completions 选 <em><code>gpt-4o-search-preview</code></em> 并可传 <code>web_search_options</code>；b) Responses API 在 <code>tools</code> 数组加入 <code>{"type":"web_search_preview"}</code></td><td>内联引用 <code>url_citation</code></td><td>搜索调用按 $10/千次计费（推理模型）或 $25/千次（非推理模型），搜索内容 token 按模型费率另计（2026-09 官方定价页核验，gpt-4o-search-preview 专用模型及 22.5/10 美元档已下线）</td><td>仅 4o 系列；β阶段，部分 API 参数不支持<a href="https://platform.openai.com/docs/guides/tools-web-search" target="_blank" rel="noreferrer noopener nofollow">6</a></td></tr><tr><td>Gemini (Google)</td><td>✅</td><td><code>tools:[{"google_search":{}}]</code>，可在 <code>client.models.generate_content</code> 或 Vertex AI Chat Completions 使用</td><td>内联链接＋<code>Search Suggestions</code></td><td>$14 / 1000 次检索（Gemini 3.x，每月前 5,000 次免费），token 另计</td><td>动态检索阈值 <code>retrieval_threshold</code>；可与多达 10 个检索源混用</td></tr><tr><td>Claude 3.x</td><td>✅</td><td><code>tools:[{"type":"web_search_20250305","name":"web_search","max_uses":N,...}]</code></td><td>强制返回出处；可设 <code>allowed_domains</code> / <code>blocked_domains</code> / <code>user_location</code></td><td>$10 / 1000 次检索＋模型 token</td><td>Claude 3.7 Sonnet、3.5 系列及 4 Opus 支持；默认迭代检索，可限定 <code>max_uses</code></td></tr></tbody></table></figure>



<h2 class="wp-block-heading">逐模型解析</h2>



<h2 class="wp-block-heading">1. DeepSeek</h2>



<p class="wp-block-paragraph">DeepSeek 在阿里云 <em>LLM API</em> 控制台可对 <em>deepseek-r1</em> 打开「联网搜索」插件。调用时在请求体设置</p>



<pre class="wp-block-code"><code><code>"enable_search": true
</code></code></pre>



<p class="wp-block-paragraph">即可由后台调用夸克搜索返回摘要片段并拼接到上下文中，并在消息尾部给出简短 URL 引用。功能尚属公测，尚未向 DeepSeek-V3/V2 等其他型号开放。</p>



<h2 class="wp-block-heading">2. 豆包（Doubao）</h2>



<p class="wp-block-paragraph">火山引擎 Ark 支持为 <em>bot</em>/工作流挂载「联网插件」，返回结构定义见官方文档（<code>site_name/summary/url</code> 等字段）。插件实际调用字节系搜索（含抖音百科、字节搜索等），但 <strong>OpenAI 兼容 <code>chat/completions</code> 接口暂无 <code>enable_search</code> 字段</strong>，需通过 Ark 流程或自行集成外部搜索源。</p>



<h2 class="wp-block-heading">3. 通义千问（Qwen）</h2>



<p class="wp-block-paragraph">DashScope 网页版已将千问同「联网搜索、网页解析」打包，但 SDK / HTTP API 暂未暴露对应参数。开发者通常采用 <em>函数调用</em>＋Bing/Brave SERP API 实现检索再回写上下文。阿里云 <em>OpenSearch</em> 最近只对 DeepSeek-R1 试点，千问暂未列入。</p>



<h2 class="wp-block-heading">4. ChatGPT / OpenAI</h2>



<ul class="wp-block-list">
<li><strong>两条调用路径</strong></li>
</ul>



<ol class="wp-block-list">
<li><strong>Chat Completions</strong> 直接选 <code>gpt-4o-search-preview</code> / <code>gpt-4o-mini-search-preview</code>，可附 <code>web_search_options</code>（<code>search_context_size</code>/<code>user_location</code> 等）。</li>



<li><strong>Responses API</strong> 任意模型 + <code>tools:[{"type":"web_search_preview"}]</code> 在需要时自动检索<a href="https://platform.openai.com/docs/guides/tools-web-search" target="_blank" rel="noreferrer noopener nofollow">6</a>。</li>
</ol>



<ul class="wp-block-list">
<li><strong>输出</strong> 以 <code>url_citation</code> 嵌入文本并在 <code>annotations</code> 带完整 URL。</li>



<li><strong>计价</strong> 检索使用独立模型，token 价格略高；不同 <code>search_context_size</code> 影响费用7。</li>
</ul>



<h2 class="wp-block-heading">5. Gemini</h2>



<p class="wp-block-paragraph">在 Gemini Developer API 或 Vertex AI 调用时加入</p>



<pre class="wp-block-code"><code><code>"tools": &#91;{"google_search":{}}]
</code></code></pre>



<p class="wp-block-paragraph">即可启用 <strong>Grounding with Google Search</strong>，Google 在后台完成查询、去重、排序，并返回带来源链接的答案。</p>



<p class="wp-block-paragraph">可通过 <code>dynamic_retrieval.rerank_threshold</code>（AI Studio UI）或 SDK <code>retrieval_threshold</code> 精细控制是否检索；<code>user_location</code> 自动影响本地化结果。付费层面按检索请求计价：Gemini 3.x 为 $14/千次（每月前 5,000 次免费），旧款 2.5 系列为 $35/千次（2026-09 核验）。</p>



<h2 class="wp-block-heading">6. Claude</h2>



<p class="wp-block-paragraph">将 <code>"type":"web_search_20250305"</code> 工具加入 <code>tools</code> 字段并指定 <code>max_uses</code> 即可；Claude 会自行决定查询词、迭代多次并生成带引用结果。<br>高级控制：</p>



<ul class="wp-block-list">
<li><strong>域名过滤</strong> <code>allowed_domains</code> / <code>blocked_domains</code></li>



<li><strong>地域</strong> <code>user_location</code></li>



<li><strong>迭代深度</strong> <code>max_uses</code>——超限将触发 <code>max_uses_exceeded</code> 错误<a href="https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool" target="_blank" rel="noreferrer noopener nofollow">1</a>。<br>费用 $10/千次检索＋模型 token，现已覆盖 Claude 4 Opus、3.7 Sonnet、3.5 Haiku/Sonnet。</li>
</ul>



<h2 class="wp-block-heading">选型建议</h2>



<ol class="wp-block-list">
<li><strong>立即用到“官方级”实时信息</strong>：首选 <strong>Gemini</strong>（质量＋全球检索覆盖）或 <strong>Claude</strong>（引用控制粒度高），若已有 OpenAI 生态则可用 <em>GPT-4o-search-preview</em> 快速接入。</li>



<li><strong>团队在国内落地、需备案合规</strong>：DeepSeek-R1 的 Quark Search 通道是现阶段可公测的选择；豆包目前需通过 Ark 插件使用；千问则建议结合自建 RAG。</li>



<li><strong>要严格限定信息源或减少幻觉</strong>：Claude 的域名黑白名单和 <code>max_uses</code> 能提供最强可控性。</li>



<li><strong>成本敏感且查询量大</strong>：把检索放在自身后端，用 SERP API＋函数调用让任意模型阅读搜索结果，可完全避开平台搜索费。</li>
</ol>



<h2 class="wp-block-heading">参考代码片段</h2>



<pre class="wp-block-code"><code><code><em># OpenAI Responses API 调用内置检索</em>
from openai import OpenAI
client = OpenAI()
resp = client.responses.create(
    model="gpt-4o",
    tools=&#91;{"type":"web_search_preview", "search_context_size":"low"}],
    input="最新 GPT-4o 模型的价格是多少？"
)
print(resp.output_text)
</code></code></pre>



<pre class="wp-block-code"><code><code><em># Gemini Developer API 调用 Google Search Grounding</em>
from google import genai
cli = genai.Client()
resp = cli.models.generate_content(
    model="gemini-2.5-flash",
    contents="今年奥运会乒乓球男单冠军是谁？",
    config=genai.types.GenerateContentConfig(
        tools=&#91;{"google_search":{}}],
    )
)
print(resp.text)
</code></code></pre>



<pre class="wp-block-code"><code><code><em># Claude 3.7 Sonnet 启用 web_search，限制最多 2 次查询</em>
import anthropic, os, json
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
msg = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=1024,
    tools=&#91;{
       "type":"web_search_20250305",
       "name":"web_search",
       "max_uses":2,
       "allowed_domains":&#91;"bbc.com","reuters.com"]
    }],
    messages=&#91;{"role":"user","content":"请给出最近一次英国基准利率决议要点"}]
)
print(json.dumps(msg,indent=2))
</code></code></pre>



<p class="wp-block-paragraph"><strong>总结</strong>：真正原生、开箱即用的“联网搜索”目前仅存在于 <strong>OpenAI GPT-4o 系列、Google Gemini、Anthropic Claude 以及小范围公测的 DeepSeek-R1</strong>。其他（豆包、通义千问等）仍需插件或外部搜索 API 配合。选择时应综合考虑<strong>调用简易度、引用透明度、费用及监管合规</strong>，并预留 fallback 方案（自建 RAG 或函数调用）以应对服务变动。</p>