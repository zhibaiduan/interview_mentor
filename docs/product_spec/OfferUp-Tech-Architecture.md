# OfferUp — 技术架构与数据库设计

**文档性质** 技术规格文档  
**版本** v1.3  
**更新时间** 2026-06-19（v1.3：冻结生产目录结构、API 边界、Supabase wrapper、prompt/fallback/env contract）  
**关联文档** 主 PRD · Agent 设计规格 · 设置页规格

---

## 1. 技术选型总览

### 1.1 选型原则

面向非技术背景的个人开发者，MVP 阶段，约束条件：
- 一人开发，12 天交付
- 体验质量优先（视觉和交互不妥协）
- 成本敏感（seed user 阶段控制在 $10 以内）
- 可扩展（结构允许 V2 接入新功能，不返工）

原则：**托管服务优先，不自维护基础设施；全栈一体，减少技术边界。**

---

### 1.2 技术栈决策表

| 层级 | 选择 | 替代方案 | 选择理由 |
|------|------|---------|---------|
| 前端框架 | Next.js 14 App Router | Vite + React | 全栈一体，API Routes 即后端，无需维护独立服务器 |
| 样式 | Tailwind CSS | CSS Modules | 开发速度快，设计系统一致性强，体验敏感场景最合适 |
| 动效 | Framer Motion | CSS 动画 | 来电动画、页面转场等高质量动效，代码量少 |
| 状态管理 | Zustand | Redux / Context | 轻量，适合 MVP 规模，无样板代码 |
| 认证 | Supabase Auth | NextAuth | 和数据库一体，含 Google OAuth，零配置 |
| 数据库 | Supabase PostgreSQL | PlanetScale | 关系型，RLS 行级安全，免费额度够 MVP |
| 文件存储 | Supabase Storage | S3 | 和数据库同平台，简历/音频文件存储 |
| 主力 AI | DeepSeek API | Claude / GPT-4 | 成本极低（约为 GPT-4 的 1/20），质量满足需求 |
| 语音转文字 | OpenAI Whisper API | Web Speech API | 多语言准确率高，$0.006/分钟；MVP 主路径必须支持口语作答 |
| 面试官语音 | 高自然度 voice model / 预生成自然音频 | Browser Speech Synthesis | 机械感 TTS 会破坏真实面试感；MVP 可先用文字展示面试官问题，但候选人回答必须支持语音输入 |
| 部署 | Vercel | Railway / Fly.io | 和 Next.js 原生集成，自动 CI/CD，hobby 免费 |
| 音频录制 | MediaRecorder API | 第三方库 | 浏览器原生，无额外依赖 |

---

### 1.3 成本估算

**单次完整面试（3 题 + 追问）：**

| 服务 | 用量 | 单价 | 费用 |
|------|------|------|------|
| DeepSeek — 输入解析 + 问题生成 | ~3000 tokens | $0.14/1M | ~$0.0004 |
| DeepSeek — 追问生成（3次） | ~2000 tokens | $0.14/1M | ~$0.0003 |
| DeepSeek — 反馈生成（2 Agent） | ~8000 tokens | $0.14/1M | ~$0.001 |
| Whisper — 语音转文字（5分钟） | 5 min | $0.006/min | ~$0.03 |
| **合计（含语音）** | | | **~$0.032** |
| **合计（纯文字）** | | | **~$0.002** |

**100 次 seed user 测试总成本：约 $3–5，完全可控。**

**平台免费额度（MVP 阶段不需要付费）：**
- Supabase free：500MB 数据库，1GB 存储，50MB 文件上传
- Vercel hobby：无限部署，100GB 带宽/月
- DeepSeek：按量付费，无最低消费

### 1.3.1 Credit 成本控制原则

MVP 必须有 credit 系统，避免用户重复触发高成本 AI workflow。

原则：
- 每个新用户获得固定免费 credits，例如 10 credits。
- 一场完整模拟面试在开始时预扣 credits，避免用户反复生成问题但不完成。
- 低成本操作可免费或低扣费，例如查看历史、编辑答案库。
- 高成本操作必须扣费，例如创建面试、语音转写、答案 polish、重新生成反馈。
- 所有扣费通过 ledger 记账，不直接“静默改余额”。
- 幂等请求不得重复扣费，例如重复点击开始面试、网络重试提交回答。

MVP 建议 credit 单价：

| 操作 | Credit | 说明 |
|------|--------|------|
| 创建一场模拟面试 | 3 | 包含 fit_map + 3 个主问题 + 追问 + 总体/单题反馈 |
| Answer Polish 一题 | 1 | 每生成一个 polished version 扣一次 |
| 额外重新生成反馈 | 1 | 用户主动 retry 且已有成功反馈时扣费 |
| STT 转写 | 包含在面试 credit 内 | MVP 不按每段语音单独扣，避免用户紧张 |
| 保存/编辑 Answer Bank | 0 | 非 AI 操作不扣费 |

后续可以改成订阅或购买包，但 MVP 先用简单 credits 控制成本。

### 1.4 核心等待时间预算

MVP 体验按“可感知等待”设计，而不是只看模型调用耗时。

| 场景 | 目标等待 | 超时/降级策略 |
|------|----------|---------------|
| 创建模拟面试：输入解析 + 问题生成 | 2–5 秒 | 超过 8 秒显示 loading 文案；超过 15 秒允许重试 |
| 每次语音回答转写 | 1–4 秒（30–90 秒录音） | 转写失败则提示重录或改用键盘补录；不丢原录音前端状态 |
| 每次追问判断 | 1–3 秒 | 超过 10 秒跳过追问，进入下一题 |
| 面试官追问语音播放准备 | 0–3 秒 | 文本先展示，语音稍后播放；不要让用户只等音频 |
| 结束后生成总体反馈 | 5–10 秒 | 总体结论先展示，单题详情继续生成 |
| 结束后生成完整单题反馈 | 10–25 秒 | 单题卡片显示 skeleton；用户展开某题时可触发/优先生成该题 |

实现原则：
- 创建面试时，Step 1 和 Step 2 可以在同一个用户等待阶段完成，前端显示来电/准备动画。
- 面试进行中，每次用户提交语音后先完成转写，再把文字答案提交给追问判断。
- 面试官问题/追问应优先显示文字，语音是增强层；不要因为 TTS 未完成阻塞下一步。
- 反馈页采用渐进式加载：总体反馈先出，单题详情后出或按需生成。
- 单次口语回答录音上限为 5 分钟；推荐 UI 在 2 分钟后轻提示用户收束，5 分钟自动停止并进入转写。

---

## 2. 系统架构

### 2.1 四层架构

```
┌─────────────────────────────────────┐
│           用户层（浏览器）             │
│     Web App · 移动端自适应            │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│        前端层（Vercel 托管）           │
│  Next.js 14 App Router               │
│  ├── 页面路由（App Router）            │
│  ├── UI 组件（Tailwind + Framer）     │
│  ├── 状态管理（Zustand）               │
│  └── 音频录制（MediaRecorder API）    │
└──────────────┬──────────────────────┘
               │ Server Actions / Route Handlers
┌──────────────▼──────────────────────┐
│        API 层（Next.js 服务端）        │
│  ├── AI 编排（5步工作流）              │
│  ├── 会话管理（问题链状态）             │
│  ├── 反馈生成（Agent 调用）            │
│  └── 数据读写（Supabase SDK）         │
└──────┬───────┬───────────┬──────────┘
       │       │           │
┌──────▼──┐ ┌──▼──────┐ ┌──▼────────┐
│Supabase │ │DeepSeek │ │  Whisper  │
│Postgres │ │  API    │ │   API     │
│Auth     │ │         │ │  (P1)     │
│Storage  │ └─────────┘ └───────────┘
└─────────┘
```

### 2.2 核心数据流：一次完整面试

**7 个步骤，3 个阶段（准备 → 会话循环 → 收尾）**

---

#### 准备阶段

**Step 1 · 输入解析** `POST /api/session/create`

触发时机：用户点击「开始面试」后立即执行，来电动画期间后台运行。

```
输入：resume_text · jd_text（或 generic_role）· focus_type · level · language
             ↓ DeepSeek · 约 0.5s
输出 fit_map：
  {
    candidate_strengths: ["具体经历1", "具体经历2"],
    job_requirements:    ["岗位要求1", "岗位要求2"],
    match_points:        ["匹配点1"],
    gap_points:          ["gap1", "gap2"],
    resume_highlights:   ["项目A", "项目B"]
  }

写入：interview_sessions.fit_map（含 interviewer_agent 身份映射结果）
```

无 JD 只有通用角色时：job_requirements 和 gap_points 用该角色通用 benchmark 填充。

`fit_map` 是“候选人和目标岗位的匹配地图”：它不是用户直接看到的页面，而是后续出题、追问和反馈的结构化上下文。它把简历亮点、岗位要求、匹配点和缺口先整理清楚，避免后续 Agent 每一步都重新理解一遍简历/JD。

---

**Step 2 · 问题生成** `POST /api/session/questions`

```
输入：fit_map + focus_type + level + language
     + 题库参考（question_library 按 category+difficulty 抽 5–8 条，AI 可变种不照抄）
             ↓ DeepSeek · 约 1–2s
输出：固定 3 道主问题
  {
    questions: [
      {
        chain_index: 0,
        question_text: "具体问题",
        intent: "这道题考察什么",
        resume_reference: "基于简历中哪个项目或经历"
      },
      ...
    ]
  }

写入：question_chains 表，3 条记录，exchanges 初始化为 []
```

---

#### 会话循环阶段（每题重复，共 3 题）

**Step 3a · 推送问题 → 用户回答** `POST /api/session/answer`

```
前端：展示问题文本（高自然度面试官音频可选）
用户：文字输入 / Push to Talk 录音→Whisper 转写→直接提交（P1）
提交：{ session_id, chain_index, answer_text }

写入：追加到 question_chains.exchanges
  { role: "candidate", content: answer_text, is_followup: false }
```

**MVP 语音链路选择：**

采用“两段式语音理解”：

```
用户说话
  → 浏览器 MediaRecorder 录音
  → 后端调用 Whisper / STT 转成文字
  → 将 answer_text 交给 DeepSeek 做追问判断和后续反馈
```

不采用“直接把音频发给面试大模型理解”的端到端链路。原因：
- 两段式更便宜、更稳定，失败点也更容易处理。
- 面试反馈、答案库、追问判断本质上都需要文字 transcript。
- 后续可以在 `exchanges` 中同时保存 `audio_url` 和 `transcript`，但 MVP 先以 transcript 为主。
- 如果转写错了，用户可以在提交前看到文字并快速修正，避免模型基于错误音频理解继续追问。

产品上，MVP 必须支持口语作答；键盘输入只作为补救和调试入口，不作为主体验。

**Step 3b · 追问判断** （同一 API 调用内返回）

```
输入：当前题 intent + 完整 exchanges + follow_up_intensity 上限
             ↓ DeepSeek · 约 0.5–1s

判断依据（Agent skill）：
  ├── 回答是否覆盖了 intent 要考察的核心点？
  ├── 是否有值得深挖的具体细节（项目/决策/结果）？
  └── 当前追问次数是否已达上限？（low:1 / medium:3 / high:5）

输出：{ should_followup: bool, followup_question: string | null }

如果 should_followup = true：
  → 追问写入 exchanges { role: "interviewer", is_followup: true }
  → 返回追问文本给前端展示
  → 等待用户再次回答，回到 Step 3a

如果 should_followup = false：
  → 返回 { next_action: "next_question" | "end" }
  → next_question：进入下一题（chain_index + 1），回到 Step 3a
  → end：触发结束流程
```

---

#### 收尾阶段

**Step 4 · 结束触发**

两种触发方式，执行相同逻辑：

```
触发 A：第 3 题追问判断返回 false / 达上限，且 chain_index = 2
触发 B：用户主动点击「结束面试」→ 确认弹窗 → 确认

执行：
  1. 播报固定结束语（预设文案，不动态生成）
  2. interview_sessions.status → "completed"，写入 completed_at
  3. 跳转过渡页
```

**Step 5 · 过渡页 + 渐进式反馈生成** `POST /api/session/feedback`

```
前端：显示「感谢完成面试，正在生成你的专属反馈...」
     轮询 GET /api/session/:id/feedback-status（每 2 秒一次）
     收到 feedback_status = 'summary_ready' → 显示「查看总体反馈」按钮
     收到 feedback_status = 'ready' → 单题详情全部完成
     收到 feedback_status = 'failed' → 显示「生成失败，点击重试」按钮

feedback_status 状态机：
  pending     → 面试结束，尚未触发生成
  generating  → POST /api/session/feedback 已触发，正在生成
  summary_ready → 总体反馈已完成，可进入反馈页
  ready       → 总体反馈 + 单题详情全部完成
  failed      → 关键反馈失败且 retry 耗尽

异步可靠性约束：
  - POST /api/session/feedback 必须幂等；同一 session 重复触发不能生成多份反馈
  - 只有 feedback_status = pending 或 failed 时允许进入 generating
  - generating 超过 3 分钟视为 stale，允许用户重试
  - 每次触发写入 feedback_started_at 和 feedback_retry_count
  - session_feedback 使用 upsert，避免重试时 unique(session_id) 冲突

后台渐进执行：
  Step 6a · Overall Summary Agent（优先执行，目标 5–10 秒）
    输入：fit_map + 所有 question_chains.exchanges + focus_type + level + language
    输出：overall_score + summary + top_strength + top_gap + next_action
    写入：session_feedback.interviewer_overall 的 summary 部分
    完成后：interview_sessions.feedback_status → 'summary_ready'

  Step 6b · Per-question Interviewer Feedback（随后执行，可并行或按题执行）
    输入：fit_map + 所有 question_chains.exchanges + focus_type + level + language
    身份：HR / Hiring Manager / 综合（由 focus_type 映射）
    输出：逐题 interviewer_feedback
    写入：question_chains.interviewer_feedback

  Step 6c · Per-question Mentor Feedback（最后执行，可在用户展开单题时优先生成该题）
    输入：同上 + 对应题 interviewer_feedback
    身份：固定
    输出：逐题 mentor_feedback + mentor_overall 补充
    写入：question_chains.mentor_feedback · session_feedback.mentor_overall

  完成后：interview_sessions.feedback_status → 'ready'
  失败时：interview_sessions.feedback_status → 'failed'，写入 feedback_error

预计等待时间：
  - 总体反馈可见：5–10 秒
  - 单题详情全部完成：10–25 秒
  - 用户展开某一题时：优先生成/刷新该题详情
```

**轮询接口：** `GET /api/session/:id/feedback-status`
```json
{ "feedback_status": "pending | generating | summary_ready | ready | failed", "feedback_error": null }
```

**Step 7 · 跳转反馈页** `GET /api/session/:id/result`

```
用户点击「查看反馈」→ 读取完整反馈数据 → 渲染反馈页
```

---

#### API 路由汇总

```
POST /api/session/create      → Step 1（输入解析 + 写入 sessions）
POST /api/session/questions   → Step 2（问题生成 + 写入 question_chains）
POST /api/session/answer      → Step 3a+3b（回答提交 + 追问判断）
POST /api/session/end         → Step 4（结束触发 + 状态更新）
POST /api/session/feedback    → Step 5+6（反馈生成，后台串行异步）
GET  /api/session/:id/feedback-status → 轮询反馈生成状态
GET  /api/session/:id/result  → Step 7（读取完整反馈）
```

---

## 3. 页面路由设计

```
app/
├── page.tsx                          → M1 Landing Page
├── auth/
│   ├── page.tsx                      → M2 登录/注册统一页（tab 切换）
│   └── callback/route.ts             → Supabase OAuth callback
├── setup/page.tsx                    → M3 面试前设置
│                                      → 支持 ?panel=resumes / ?panel=jd-history 打开当前页内 picker
├── session/
│   ├── [id]/
│   │   ├── call/page.tsx             → 来电动画
│   │   ├── interview/page.tsx        → M5 面试会话
│   │   └── feedback/page.tsx         → M6 反馈页
├── library/page.tsx                  → M10 题库（P2，可在核心闭环完成后再加）
├── bank/page.tsx                     → M8 答案库
├── home/page.tsx                     → M9 个人主页
└── api/
    ├── session/
    │   ├── create/route.ts        → Step 1 输入解析
    │   ├── questions/route.ts     → Step 2 问题生成
    │   ├── answer/route.ts        → Step 3 回答提交 + 追问判断
    │   ├── end/route.ts           → Step 4 结束触发
    │   ├── feedback/route.ts      → Step 5+6 反馈生成（异步）
    │   └── [id]/
    │       ├── feedback-status/route.ts → 轮询反馈状态
    │       └── result/route.ts          → Step 7 读取反馈
    └── bank/
        ├── save/route.ts
        └── [id]/route.ts
    
    ⚠️  认证统一使用 Supabase Auth，不使用 NextAuth。
        无 auth/[...nextauth] 路由。

    ⚠️  MVP 不创建 /resumes 或 /jd-history 独立管理页。
        Dashboard 的 My resumes / JD history 入口进入 /setup?panel=...
        由 Setup 页面内的 picker drawer / modal 完成复用。
```

---

## 4. Production Structure Freeze

本节是正式 Next.js rebuild 的实现边界。除非规格变更，生产代码按此结构创建，不再临时发明目录。

### 4.1 顶层目录

```text
app/                         # Next.js App Router pages and route handlers
components/
  ui/                        # Button, Input, Badge, Panel, Modal, Toast...
  layout/                    # MarketingShell, AppShell, ReportShell
  product/                   # Dashboard, Setup, Interview, Feedback, Bank modules
lib/
  ai/                        # DeepSeek client, workflow orchestration, prompts, schemas
  auth/                      # auth redirect helpers and protected route utilities
  demo/                      # deterministic fallback data and demo scenario constants
  supabase/                  # browser/server/admin Supabase clients
  validators/                # zod schemas for API inputs and AI outputs
  utils/                     # small shared utilities only
styles/
  tokens.css                 # design-system CSS variables
  globals.css                # base canvas, typography, reset, focus styles
supabase/
  migrations/                # SQL schema and RLS migrations
  seed.sql                   # optional question_library seed data
docs/
  product_spec/              # source-of-truth specs
```

Rules:

- Route/page files compose product modules; they should not define one-off visual systems.
- Shared UI primitives live in `components/ui/*` and consume `styles/tokens.css`.
- Product-specific components live in `components/product/<module>/*`.
- AI prompt text and schemas live under `lib/ai/*`; route handlers call workflows, not raw prompt strings.

### 4.2 Route Handlers vs Server Actions

MVP uses **Route Handlers for business workflows** and keeps Server Actions optional/lightweight.

Use Route Handlers for:

- AI calls and workflow orchestration.
- Supabase writes that affect interview/session/bank state.
- Auth callback.
- Feedback polling/result loading when a stable HTTP boundary is useful.
- Any operation needing service-role access, retries, timeout, or fallback behavior.

Use Server Components / server-side data loading for:

- Initial page reads where no mutation is needed.
- Dashboard/home data aggregation if it does not require client-side polling.

Use Server Actions only for:

- Small UI-adjacent form actions that do not call AI and do not need complex retry/fallback.
- They are not the primary architecture for MVP workflows.

Reason: Route Handlers give clearer API contracts, are easier to test with demo fallback, and avoid mixing AI workflow logic into React components.

### 4.3 Supabase Client Wrapper Pattern

```text
lib/supabase/client.ts       # browser client, uses anon key
lib/supabase/server.ts       # server client, reads/writes auth cookies
lib/supabase/admin.ts        # service-role client, route handlers only
```

Rules:

- `client.ts` is used only in Client Components.
- `server.ts` is used in Server Components, middleware, and route handlers when acting as the current user.
- `admin.ts` is used only in route handlers for trusted server workflows, never imported by React components.
- RLS remains enabled even when admin client exists; service-role usage must be narrow and documented at call sites.
- User-owned reads/writes should prefer the current-user server client unless a workflow genuinely needs elevated access.

### 4.4 AI Prompt And Workflow Locations

```text
lib/ai/deepseek.ts
lib/ai/workflows/create-session.ts
lib/ai/workflows/generate-questions.ts
lib/ai/workflows/submit-answer.ts
lib/ai/workflows/generate-feedback.ts
lib/ai/workflows/polish-answer.ts
lib/ai/observability/langsmith.ts
lib/ai/prompts/fit-map.ts
lib/ai/prompts/questions.ts
lib/ai/prompts/follow-up.ts
lib/ai/prompts/interviewer-feedback.ts
lib/ai/prompts/mentor-feedback.ts
lib/ai/prompts/answer-polish.ts
lib/ai/schemas.ts
```

Rules:

- Prompts export functions that accept typed inputs and return prompt messages.
- Workflows own retries, timeout, JSON parsing, validation, fallback selection, and database writes.
- Route handlers validate request input, call one workflow, and return a stable response shape.
- Agent output schemas should be centralized in `lib/ai/schemas.ts` with zod or equivalent validation.
- LangSmith tracing lives behind `lib/ai/observability/langsmith.ts`; workflow code should call a local wrapper, not import LangSmith directly everywhere.

### 4.5 Demo Fallback Data Location

```text
lib/demo/demo-scenario.ts       # fixed resume, JD, setup config, and story context
lib/demo/fallback-session.ts    # deterministic session/questions/exchanges/feedback/polish/bank example
```

Rules:

- Demo fallback is deterministic and complete enough to run Landing → Setup → Interview → Feedback → Polish → Save to Bank.
- API workflows may use fallback data when required env vars are missing in local demo mode, or when `DEMO_MODE=true`.
- Production must not silently replace a real user's resume/JD feedback with unrelated demo feedback. In production, AI failure should return a recoverable error or a clearly labeled generic fallback based on the user's own submitted text.
- UI should not scatter hardcoded fallback snippets across route files.
- The fixed demo scenario is also documented in `OfferUp-Demo-Scenario.md`.

### 4.6 Environment Variable Contract

Required for production:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
LANGSMITH_TRACING
LANGSMITH_API_KEY
LANGSMITH_PROJECT
```

Optional / local-development:

```text
DEEPSEEK_BASE_URL
OPENAI_API_KEY              # P1 Whisper transcription
OPENAI_STT_MODEL            # default: whisper-1 or current approved Whisper model
DEMO_MODE                   # true enables deterministic fallback-first demo mode
LANGSMITH_ENDPOINT          # only needed for non-US LangSmith regions
LANGSMITH_WORKSPACE_ID      # only needed when API key has access to multiple workspaces
LANGCHAIN_CALLBACKS_BACKGROUND # false recommended in serverless so traces flush before function exits
```

Rules:

- No secret keys may be prefixed with `NEXT_PUBLIC_`.
- Missing DeepSeek key in local development should not crash the app; workflows fall back to demo data and log a server-side warning.
- Missing Supabase env vars is fatal because auth/database cannot function.
- Missing LangSmith env vars must not break product behavior; tracing should become a no-op with a server-side warning in development.
- `.env.example` must include all variables with empty values and short comments.

---

## 5. 数据库设计

### 5.1 设计原则

- 所有表都有 `user_id` 外键（Supabase RLS 行级安全基于此字段）
- AI 生成的结构化数据用 `jsonb` 存储（schema 变化时不需要迁移）
- 固定字段（用于过滤、排序、统计）用独立列
- `question_chains.exchanges` 存完整对话记录，保留追问上下文

### 5.2 表结构详细说明

---

#### `users`
Supabase Auth 自动管理，只需扩展 `display_name`。

```sql
-- 由 Supabase Auth 自动创建，扩展如下：
create table public.profiles (
  id        uuid references auth.users on delete cascade primary key,
  display_name  text,
  created_at    timestamp with time zone default now()
);
```

**通用更新时间 trigger function：**

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

---

#### `resumes`
用户保存的简历，可在面试设置时复用。

```sql
create table resumes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  title        text not null,          -- 用户给这份简历起的名字，如「2026 PM 简历」
  content_text text not null,          -- 简历全文
  created_at   timestamp with time zone default now(),
  updated_at   timestamp with time zone default now()
);

create trigger resumes_updated_at
  before update on resumes
  for each row execute function update_updated_at();
```

---

#### `jd_history`
用户使用过的 JD，可在面试设置时复用。

```sql
create table jd_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  company_name text,                   -- 公司名（可选）
  job_title    text not null,          -- 岗位名
  jd_text      text,                   -- JD 原文（可选，通用角色时为空）
  created_at   timestamp with time zone default now(),
  updated_at   timestamp with time zone default now()
);

create trigger jd_history_updated_at
  before update on jd_history
  for each row execute function update_updated_at();
```

---

#### `credit_accounts`
用户 credit 余额账户。每个用户一条记录。

```sql
create table credit_accounts (
  user_id           uuid references auth.users on delete cascade primary key,
  balance           int not null default 10,
  lifetime_granted  int not null default 10,
  lifetime_spent    int not null default 0,
  created_at        timestamp with time zone default now(),
  updated_at        timestamp with time zone default now(),

  constraint chk_credit_balance_nonnegative check (balance >= 0),
  constraint chk_credit_lifetime_nonnegative check (lifetime_granted >= 0 and lifetime_spent >= 0)
);

create trigger credit_accounts_updated_at
  before update on credit_accounts
  for each row execute function update_updated_at();
```

账户创建：
- 用户首次登录后创建 `profiles` 时，同时创建 `credit_accounts`。
- MVP 默认赠送 10 credits。
- 后续邀请、购买、管理员补发都通过 `credit_ledger` 写入，不直接改余额。

---

#### `credit_ledger`
Credit 流水账。所有 credit 变化必须有 ledger 记录。

```sql
create table credit_ledger (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users on delete cascade not null,
  session_id          uuid references interview_sessions on delete set null,
  answer_bank_id      uuid references answer_bank on delete set null,

  amount              int not null,
  -- positive = grant/refund, negative = spend

  reason              text not null,
  -- 'signup_grant'|'interview_start'|'answer_polish'|'feedback_regenerate'|'refund'|'admin_adjustment'

  idempotency_key     text not null,
  metadata            jsonb not null default '{}',
  created_at          timestamp with time zone default now(),

  constraint chk_credit_ledger_amount_nonzero check (amount <> 0),
  constraint chk_credit_ledger_reason check (reason in (
    'signup_grant',
    'interview_start',
    'answer_polish',
    'feedback_regenerate',
    'refund',
    'admin_adjustment'
  )),
  unique (user_id, idempotency_key)
);
```

Ledger 规则：
- Spend 使用负数，例如开始面试 `amount = -3`。
- Grant/refund 使用正数，例如注册赠送 `amount = 10`。
- `idempotency_key` 必须由业务对象决定，例如 `interview_start:{session_id}`，避免重复扣费。
- 余额更新和 ledger 插入必须在同一事务或数据库 RPC 中完成。

---

#### `interview_sessions`
每次面试的完整配置和状态记录。

```sql
create table interview_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users on delete cascade not null,
  resume_id            uuid references resumes on delete set null,        -- nullable，用通用角色时为空
  jd_id                uuid references jd_history on delete set null,     -- nullable
  
  -- 面试配置
  mode                 text not null,   -- 'focused' | 'full_process'
  focus_type           text,            -- 'resume_deep_dive'|'behavioral'|'motivation_fit'|'culture_collaboration'|'situational'
  level                text not null,   -- 'junior' | 'mid' | 'senior'
  language             text not null default 'en',
  follow_up_intensity  text not null default 'medium', -- 'off'|'low'|'medium'|'high'
  interviewer_agent    text not null,   -- 'hr' | 'hiring_manager' | 'combined'

  -- 输入快照与 AI 上下文
  resume_text_snapshot text,             -- 创建面试当刻的简历文本快照
  jd_text_snapshot     text,             -- 创建面试当刻的 JD 文本快照；通用角色时可为空
  generic_role         text,             -- 无 JD 时的通用岗位名
  fit_map              jsonb not null default '{}',
                                        -- Step 1 生成的岗位匹配地图，供出题/反馈复用
  question_generation_meta jsonb not null default '{}',
                                        -- 题库参考、fallback、模型版本等调试信息
  
  -- 状态
  status               text not null default 'in_progress',
                                        -- 'in_progress'|'completed'|'abandoned'
  workflow_stage       text not null default 'created',
                                        -- 'created'|'questions_ready'|'interviewing'|'completed'
  current_chain_index  int not null default 0,
                                        -- 会话恢复时定位当前题
  overall_score        int,             -- 1–5，完成后填入

  -- 反馈生成状态（异步机制必须字段）
  feedback_status      text not null default 'pending',
                                        -- 'pending'|'generating'|'summary_ready'|'ready'|'failed'
  feedback_error       text,            -- 失败时的错误信息，用于 UI 提示和 retry
  feedback_started_at  timestamp with time zone,
  feedback_retry_count int not null default 0,

  created_at           timestamp with time zone default now(),
  completed_at         timestamp with time zone,
  updated_at           timestamp with time zone default now()
);

create trigger interview_sessions_updated_at
  before update on interview_sessions
  for each row execute function update_updated_at();
```

---

#### `question_chains`
每道主问题及其完整追问链路和反馈。

```sql
create table question_chains (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid references interview_sessions on delete cascade not null,
  chain_index          int not null,    -- 第几道主题（0-based）
  
  -- 问题内容
  main_question        text not null,
  question_intent      text,            -- AI 生成问题的意图说明
  
  -- 完整对话记录（含追问）
  -- 结构：[{role: 'interviewer'|'candidate', content: string, is_followup: bool}]
  exchanges            jsonb not null default '[]',
  
  -- AI 反馈（面试结束后批量填入）
  interviewer_feedback jsonb,
  -- 结构：{
  --   heard_as,
  --   positive_signals[],
  --   missing_signals[],
  --   weak_signal_tags[],
  --   language_note,
  --   score,
  --   evidence[]
  -- }
  -- weak_signal_tags 复用 question_library.tags 的能力维度词表，如 ownership/impact/conflict/metrics
  
  mentor_feedback      jsonb,
  -- 结构：{what_was_lost, interviewer_translation, better_strategy, example_rewrite, language_tip}
  
  score                int,             -- 1–5，由 interviewer agent 评分

  created_at           timestamp with time zone default now(),

  -- 约束：同一 session 内 chain_index 唯一
  unique (session_id, chain_index)
);
```

**MVP 并发安全规则：**

- `POST /api/session/answer` 必须接收 `client_message_id`，用于防止网络重试或双击提交造成重复回答。
- 后端追加 `exchanges` 前，必须重新读取最新 `question_chains.exchanges`，再 append 新消息。
- 同一 `session_id + chain_index` 在追问判断进行中时，前端禁用再次提交；后端也要拒绝重复 in-flight 请求。
- 追问问题写入 exchanges 时，也要带服务端生成的 message id，方便恢复和去重。
- MVP 仍使用 jsonb 存 exchanges，不拆独立 messages 表；如果后续要做实时协作、逐句分析或音频回放，再拆表。

---

#### `user_skill_signals`
跨 session 追踪用户在能力维度上的强弱信号。MVP 先做轻量计数，不做复杂 mastery model。

```sql
create table user_skill_signals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  skill_tag       text not null,
  weak_count      int not null default 0,
  strong_count    int not null default 0,
  last_direction  text, -- 'weak'|'strong'
  last_score      int,
  last_seen_at    timestamp with time zone default now(),
  examples        jsonb not null default '[]',
  -- [{session_id, chain_id, evidence, direction: 'weak'|'strong', created_at}]
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now(),

  unique (user_id, skill_tag),
  constraint chk_skill_signal_counts check (weak_count >= 0 and strong_count >= 0),
  constraint chk_skill_last_direction check (last_direction is null or last_direction in ('weak', 'strong')),
  constraint chk_skill_last_score check (last_score is null or last_score between 1 and 5),
  constraint chk_skill_examples_array check (jsonb_typeof(examples) = 'array')
);

create trigger user_skill_signals_updated_at
  before update on user_skill_signals
  for each row execute function update_updated_at();
```

Aggregation 规则：
- `weak_signal_tags` 来自 `question_chains.interviewer_feedback`，复用 `question_library.tags` 的能力维度词表。
- 每次单题 interviewer feedback 生成成功后，workflow 轻量更新 `user_skill_signals`。
- MVP 只累积最近 3-5 条 examples，避免 jsonb 无限制变大。
- 未来 Mentor 可以基于该表说：“这已经是你第三次在 ownership 上被追问。”

MVP 词表建议：
- `ownership`：个人贡献、职责边界、是否说清楚“我做了什么”。
- `impact`：结果、业务价值、用户价值、量化成果。
- `metrics`：是否能用数字说明结果或判断。
- `structure`：回答是否有清晰结构，如 STAR/背景-行动-结果。
- `specificity`：是否具体到项目、决策、动作，而不是泛泛而谈。
- `decision_making`：是否解释选择、取舍和原因。
- `stakeholder_management`：是否说明跨团队沟通、对齐、推动。
- `conflict`：是否能处理分歧、冲突、困难反馈。
- `reflection`：是否能总结教训和下一次改进。
- `motivation_fit`：动机、岗位理解、公司/角色匹配。
- `communication_clarity`：表达是否影响面试官理解或可信度。

这些是能力维度标签，不是题型标签。题型标签如 `behavioral`、`resume_deep_dive` 只用于分类题目；能力标签用于追踪用户长期弱点。

---

#### `session_feedback`
每次面试的全局反馈（两个 Agent 的整体评估）。

```sql
create table session_feedback (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references interview_sessions on delete cascade not null unique,
  
  -- 面试官全局反馈
  interviewer_overall  jsonb,
  -- 结构：{summary, top_strength, top_concern, would_advance, overall_score}
  
  -- Mentor 全局反馈
  mentor_overall   jsonb,
  -- 结构：{top_gap, priority_1{issue,action,example}, priority_2{issue,action}, encouragement}
  
  overall_score    int,                 -- 综合评分 1–5
  created_at       timestamp with time zone default now()
);
```

`session_feedback` 只保存整场面试的全局反馈，不重复保存每道题的详细反馈。

反馈页数据读取方式：
```text
session_feedback
  -> overall score / summary / top strength / top gap / next action

question_chains ordered by chain_index
  -> main_question
  -> exchanges
  -> interviewer_feedback
  -> mentor_feedback
  -> score
```

这样避免同一份题目反馈在 `session_feedback` 和 `question_chains` 里重复存储。`session_feedback` 可以引用全局 top examples，但完整逐题内容以 `question_chains` 为准。

---

#### `answer_bank`
用户的个人答案库，三层字段设计，并支持同一题保存多个版本。

```sql
create table answer_bank (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete cascade not null,
  chain_id         uuid references question_chains on delete set null,
  -- nullable：未来支持手动创建时为 null
  source_session_id uuid references interview_sessions on delete set null,
  source_chain_id   uuid references question_chains on delete set null,

  answer_group_id  uuid not null default gen_random_uuid(),
  -- 同一题/同一保存对象的版本分组；第一版自动生成，后续版本沿用

  version_number   integer not null default 1,
  -- 同一 answer_group_id 下从 1 递增

  -- 问题信息
  question_text    text not null,
  tag              text not null,
  -- 'resume_deep_dive'|'behavioral'|'motivation_fit'
  -- |'culture_collaboration'|'situational'|'other'
  skill_tags       jsonb not null default '[]',
  -- 能力维度标签，如 ['ownership','impact']；用于未来反哺下一次练习
  mastery_status   text not null default 'new',
  -- 'new'|'practicing'|'stable'

  -- 三层答案（均为 jsonb，存 exchanges 数组）
  original_answer  jsonb not null,
  -- { exchanges: [{role, content, is_followup}] }
  -- 永远只读，保存后锁定，来自 question_chains.exchanges

  polished_answer  jsonb,
  -- { exchanges: [...], polish_note: string }
  -- 用户点击 Answer Polish 后生成
  -- 只读；MVP 不在 Answer Bank 内重新生成
  -- Polish 有两种形态：
  --   单轮（追问消失）：第一轮回答已包含所有必要信号
  --   多轮（追问优化）：追问有价值，保留但优化双方回答

  bank_answer      jsonb not null,
  -- { exchanges: [{role, content, is_followup}] }
  -- 初始值 = original_answer 或 polished_answer（取决于保存入口）
  -- 用户可编辑：只能修改 role=candidate 的 content，面试官问题不可编辑

  -- 元信息
  source           text not null default 'original',
  -- 'original'：从反馈页保存
  -- 'polished'：从 Answer Polish 结果保存

  saved_at         timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);

-- updated_at trigger
create trigger answer_bank_updated_at
  before update on answer_bank
  for each row execute function update_updated_at();
```

**三层字段的操作逻辑：**

```
从反馈页保存原始回答：
  创建 answer_bank 记录
  answer_group_id = 自动生成的新分组 id
  version_number = 1
  bank_answer = original_answer（默认）

用户点击 Answer Polish 并保存 polished version：
  如果该题没有已有 Bank 记录：
    创建 answer_bank 记录
    answer_group_id = 自动生成的新分组 id
    version_number = 1
    bank_answer = polished_answer

  如果该题已有 Bank 记录：
    创建新的 answer_bank 记录
    answer_group_id = 已有记录的 answer_group_id
    version_number = max(version_number) + 1
    bank_answer = polished_answer
    不覆盖旧版本

用户手动编辑：
  bank_answer = 用户输入内容（自由编辑）

original_answer 永远不变，作为对照参考。旧版本永远不被 Polish 保存动作覆盖。

**Answer Bank 产品方向：**

MVP 先做“练习场”，不是只做备忘录：
- 用户保存 polished answer 后，可以回看、编辑、复述练习。
- MVP 不强做“下一次面试自动复考”，但数据模型提前埋 `skill_tags`、`source_session_id`、`source_chain_id`、`mastery_status`。
- 未来可以做“种子库”：把 `mastery_status = 'practicing'` 的能力标签反哺到下一次 question generation，让用户换个问法继续练，直到稳定。
```

---

#### `question_library`
系统预置的公共题库，AI 面试时作为参考抽题。

```sql
create table question_library (
  id            uuid primary key default gen_random_uuid(),
  category      text not null,
  -- 'resume_deep_dive'|'behavioral'|'motivation_fit'|'culture_collaboration'|'situational'
  difficulty    text not null,          -- 'junior'|'mid'|'senior'
  question_text text not null,          -- 参考题目，AI 会改造而非直接使用
  question_intent text,                 -- 这道题考察什么，帮助 AI 理解方向
  language      text not null default 'en',
  tags          jsonb default '[]',     -- ['ownership','impact','conflict'...]
  created_at    timestamp with time zone default now()
);

-- question_library 只读，不做 RLS 用户过滤
-- 所有登录用户可读，管理员通过 Supabase Dashboard 维护内容

-- 索引（AI 出题时按 category + difficulty 抽取）
create index idx_library_cat_diff on question_library(category, difficulty);
```

**题库与面试的关系：**
AI 生成问题时，将题库作为「参考池」而非「固定题目」——AI 可以基于题库中的题目结合用户简历做变种，保证个性化的同时有质量基准。

---

### 5.3 RLS 行级安全策略

Supabase 的 RLS 确保每个用户只能读写自己的数据。MVP 采用两类 ownership：

1. 直接 ownership：表内有 `user_id`，直接用 `auth.uid() = user_id`。
2. 间接 ownership：子表没有 `user_id`，通过 `interview_sessions.user_id` 判断归属。

RLS 在做什么：
- 防止用户 A 通过猜 URL、改 `session_id`、改 API 参数读到用户 B 的简历、面试记录、反馈和答案库。
- 即使前端或 Route Handler 写错查询条件，数据库层仍会拦截不属于当前用户的数据。
- 对公共题库这类共享数据，只开放登录用户 read，不开放客户端写入。
- 对 credit、skill signal 这类敏感/派生数据，用户只能读自己的结果，不能从客户端直接 insert/update/delete。

RLS 不替代后端业务校验：
- Route Handler 仍必须校验当前用户 owns session。
- service-role/admin client 会绕过 RLS，因此只能在可信 workflow 中窄范围使用。
- 扣费、反馈生成、skill signal 聚合这类写操作必须通过服务端 workflow 或 RPC。

```sql
-- profiles
alter table profiles enable row level security;

create policy "users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- resumes
alter table resumes enable row level security;

create policy "users can access own resumes"
  on resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- jd_history
alter table jd_history enable row level security;

create policy "users can access own jd history"
  on jd_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- interview_sessions
alter table interview_sessions enable row level security;

create policy "users can access own sessions"
  on interview_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- question_chains: ownership comes through interview_sessions
alter table question_chains enable row level security;

create policy "users can access own question chains"
  on question_chains for all
  using (
    exists (
      select 1 from interview_sessions s
      where s.id = question_chains.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from interview_sessions s
      where s.id = question_chains.session_id
        and s.user_id = auth.uid()
    )
  );

-- session_feedback: ownership comes through interview_sessions
alter table session_feedback enable row level security;

create policy "users can access own session feedback"
  on session_feedback for all
  using (
    exists (
      select 1 from interview_sessions s
      where s.id = session_feedback.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from interview_sessions s
      where s.id = session_feedback.session_id
        and s.user_id = auth.uid()
    )
  );

-- answer_bank
alter table answer_bank enable row level security;

create policy "users can access own answer bank"
  on answer_bank for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_skill_signals
alter table user_skill_signals enable row level security;

create policy "users can read own skill signals"
  on user_skill_signals for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy for user_skill_signals.
-- Skill signal aggregation happens in trusted feedback workflows.

-- credit_accounts
alter table credit_accounts enable row level security;

create policy "users can read own credit account"
  on credit_accounts for select
  using (auth.uid() = user_id);

-- Users must not directly update credit balances from client components.
-- Balance changes happen through trusted route handlers / database RPC only.

-- credit_ledger
alter table credit_ledger enable row level security;

create policy "users can read own credit ledger"
  on credit_ledger for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy for credit_ledger.
-- Route handlers use service role or security definer RPC after verifying current user.

-- question_library 是公共只读表，所有登录用户可读；写入只通过 Supabase Dashboard / service role
alter table question_library enable row level security;

create policy "authenticated users can read question library"
  on question_library for select
  using (auth.role() = 'authenticated');
```

Rules:

- 不给 `question_library` 创建 public insert/update/delete policy。
- Route Handler 使用 service role 写 AI 结果时仍必须先验证当前用户 owns session。
- Client Components 不直接写 `question_chains` / `session_feedback`；通过 Route Handler 触发工作流。

---

### 5.4 关键索引

```sql
-- 面试历史查询（个人主页、历史记录）
create index idx_sessions_user_created
  on interview_sessions(user_id, created_at desc);

-- Setup picker 查询
create index idx_resumes_user_updated
  on resumes(user_id, updated_at desc);

create index idx_jd_history_user_updated
  on jd_history(user_id, updated_at desc);

-- 问题链查询（反馈页加载）
create index idx_chains_session
  on question_chains(session_id, chain_index);

-- 全局反馈查询
create index idx_feedback_session
  on session_feedback(session_id);

-- 答案库查询（分类筛选）
create index idx_bank_user_tag
  on answer_bank(user_id, tag);

create index idx_bank_user_mastery
  on answer_bank(user_id, mastery_status);

-- 答案库列表查询
create index idx_bank_user_saved
  on answer_bank(user_id, saved_at desc);

-- 答案库版本查询
create index idx_bank_user_group_version
  on answer_bank(user_id, answer_group_id, version_number desc);

-- 同一分组内版本号唯一
create unique index idx_bank_group_version_unique
  on answer_bank(answer_group_id, version_number);

-- 从反馈页重复保存原始回答时不创建重复记录
create unique index idx_bank_original_chain_unique
  on answer_bank(user_id, chain_id)
  where source = 'original' and chain_id is not null;

-- 题库查询（按分类+难度抽题）
create index idx_library_category_difficulty
  on question_library(category, difficulty);

-- 跨 session 能力信号查询
create index idx_skill_signals_user_seen
  on user_skill_signals(user_id, last_seen_at desc);

-- Credit ledger 查询
create index idx_credit_ledger_user_created
  on credit_ledger(user_id, created_at desc);

create index idx_credit_ledger_session
  on credit_ledger(session_id);
```

### 5.5 必须约束

MVP 不能只靠注释约定枚举值和评分范围，迁移里必须加入 check constraints：

```sql
alter table interview_sessions
  add constraint chk_session_mode
  check (mode in ('focused', 'full_process')),
  add constraint chk_session_level
  check (level in ('junior', 'mid', 'senior')),
  add constraint chk_follow_up_intensity
  check (follow_up_intensity in ('off', 'low', 'medium', 'high')),
  add constraint chk_interviewer_agent
  check (interviewer_agent in ('hr', 'hiring_manager', 'combined')),
  add constraint chk_session_status
  check (status in ('in_progress', 'completed', 'abandoned')),
  add constraint chk_workflow_stage
  check (workflow_stage in ('created', 'questions_ready', 'interviewing', 'completed')),
  add constraint chk_feedback_status
  check (feedback_status in ('pending', 'generating', 'summary_ready', 'ready', 'failed')),
  add constraint chk_session_score
  check (overall_score is null or overall_score between 1 and 5),
  add constraint chk_current_chain_index
  check (current_chain_index between 0 and 2);

alter table question_chains
  add constraint chk_chain_index
  check (chain_index between 0 and 2),
  add constraint chk_chain_score
  check (score is null or score between 1 and 5),
  add constraint chk_exchanges_array
  check (jsonb_typeof(exchanges) = 'array');

alter table session_feedback
  add constraint chk_feedback_overall_score
  check (overall_score is null or overall_score between 1 and 5);

alter table answer_bank
  add constraint chk_answer_source
  check (source in ('original', 'polished')),
  add constraint chk_answer_version
  check (version_number >= 1),
  add constraint chk_answer_mastery_status
  check (mastery_status in ('new', 'practicing', 'stable')),
  add constraint chk_answer_skill_tags_array
  check (jsonb_typeof(skill_tags) = 'array'),
  add constraint chk_answer_tag
  check (tag in (
    'resume_deep_dive',
    'behavioral',
    'motivation_fit',
    'culture_collaboration',
    'situational',
    'other'
  ));
```

### 5.6 Credit RPC / 事务规则

Credit 扣费必须原子化，不能在应用层先查余额再扣，因为并发请求可能同时通过余额检查。

MVP 建议实现一个数据库 RPC：

```sql
-- Pseudocode
spend_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_idempotency_key text,
  p_session_id uuid default null,
  p_answer_bank_id uuid default null,
  p_metadata jsonb default '{}'
)
```

行为：
- 如果 `(user_id, idempotency_key)` 已存在，直接返回已有 ledger，不重复扣费。
- 如果余额不足，返回 `insufficient_credits`，不写 ledger。
- 如果余额足够，在同一事务中：
  1. update `credit_accounts.balance = balance - p_amount`
  2. update `lifetime_spent = lifetime_spent + p_amount`
  3. insert `credit_ledger(amount = -p_amount)`
- `p_amount` 传正数，ledger 内部写负数。

Refund 同理使用 `grant_credits` 或 `adjust_credits` RPC，写正数 ledger。

业务扣费点：
- `POST /api/session/create`：创建面试成功前预扣 3 credits。idempotency key = `interview_start:{client_request_id}` 或 `interview_start:{session_id}`。
- 如果 session 创建失败且没有生成任何可恢复状态，自动 refund 3 credits。
- 如果问题已生成但用户主动退出，不自动 refund，避免刷生成。
- `POST /api/answer-polish`：每题每次新生成 polished version 扣 1 credit。
- `POST /api/session/feedback`：首次生成已包含在面试 credit 内；只有用户主动重新生成成功反馈时扣 1 credit。

API 返回约定：

```json
{
  "error": "insufficient_credits",
  "required_credits": 3,
  "current_balance": 1
}
```

UI 处理：
- Setup 页展示当前 credits。
- credits 不足时，Start Interview 按钮 disabled，并显示获取 credits 的入口。
- MVP 如果还没有支付系统，可以显示“Request more credits / Contact admin”。

---

## 6. AI 工作流详细设计

### 6.0 Question Library 在 AI 出题中的使用方式

Question Library 是 AI 出题的**参考池**，不是题目来源。

**使用原则：**
- AI 出题时，按 `category + difficulty` 从题库抽取 5–8 道参考题
- 参考题传入 Step 2（问题生成）的 prompt，作为「这类题的典型方向」示例
- AI 不直接使用原题，而是结合用户简历和 JD 重新设计问题
- 如果没有 JD，参考题的权重更高（因为没有具体岗位信息可依赖）

**传入 prompt 的方式：**
```
以下是 {category} 类型面试在欧洲场景下的典型问题方向（仅供参考）：
{reference_questions}

请不要直接使用以上题目，而是基于候选人的具体简历和目标岗位，
重新设计 3 道个性化问题，保留考察方向但结合实际情况改造。
```

**题库内容维护：**
- 由产品团队在 Supabase Dashboard 手动维护，不开放给用户编辑
- 每个 category + difficulty 组合建议维护 10–20 道参考题
- 初始内容：覆盖欧洲 B2B SaaS 面试场景，英文
- 具体题目数量、角色覆盖和首批 seed 内容后续单独补充

**用户浏览题库（M10 页面）：**
- 用户可以按 category 浏览题库，了解「这类面试一般会涉及哪些方向」
- 只读展示，不可编辑
- P2 功能：核心面试闭环、语音作答、反馈和答案库完成后，有余力再做。

---

### 6.1 调用步骤总览

| 步骤 | 触发时机 | 模型 | 预估 tokens out | 写入位置 |
|------|---------|------|----------------|---------|
| Step 1 输入解析 | 用户提交设置 | DeepSeek V3 | ~500 | interview_sessions |
| Step 2 问题生成 | Step 1 完成后 | DeepSeek V3 | ~800 | question_chains × 3 |
| Step 3 追问判断 | 每次用户回答后 | DeepSeek V3 | ~200 | question_chains.exchanges |
| Step 6a Overall Summary Agent | 面试结束后优先执行 | DeepSeek V3 | ~500 | session_feedback summary |
| Step 6b Per-question Interviewer Feedback | 总体反馈后执行，可按题并行 | DeepSeek V3 | ~400 × 3题 | question_chains.interviewer_feedback |
| Step 6c Per-question Mentor Feedback | 面试官逐题反馈后执行，可按需优先 | DeepSeek V3 | ~400 × 3题 | question_chains.mentor_feedback + mentor_overall |

Step 6 采用渐进式生成。总体反馈优先，单题反馈随后生成；Mentor 单题反馈输入包含对应题的 Interviewer Feedback，避免两个视角互相矛盾。

### 6.2 模型选择逻辑

```
速度优先（解析、追问判断）→ DeepSeek V3
质量优先（问题生成、反馈 Agent）→ DeepSeek V3（MVP 阶段统一，稳定后可升 R1）
```

MVP 阶段统一用 DeepSeek V3，稳定后根据反馈质量决定是否对 Step 6 升级到 R1。

### 6.3 fit_map schema（Step 1 输出）

```json
{
  "candidate_strengths": ["2年PM经验", "主导过数据分析项目"],
  "job_requirements": ["B2B SaaS PM经验", "stakeholder管理"],
  "match_points": ["PM经验与岗位方向匹配"],
  "gap_points": ["缺少B2B经验提及", "未提供stakeholder案例"],
  "resume_highlights": ["NetDragon数字化项目", "WPS用户增长项目"]
}
```

此结构贯穿 Step 2（问题生成）和 Step 6（反馈 Agent），是整个 AI 链路的核心上下文。

### 6.4 追问判断 prompt 核心约束

```
你是一位面试官，刚刚听完候选人对以下问题的回答。

问题意图（intent）：{intent}
完整对话记录：{exchanges}
当前追问次数：{current_followup_count}
追问上限：{max_followups}

判断是否需要追问。追问的条件：
  - 回答没有覆盖 intent 的核心考察点
  - 回答提到了具体项目/决策但没有展开
  - 回答缺少结果或量化数据

不要追问的条件：
  - 回答已完整（有背景、行动、结果）
  - 已达追问上限
  - 追问会显得重复或无聊

输出 JSON：{ "should_followup": bool, "followup_question": string | null }
```

### 6.5 输出稳定性保障

所有 AI 调用必须：
1. prompt 末尾明确要求 JSON 输出并提供 schema 示例
2. 后端对每个必填字段做 validation，缺失时用默认值填充，不崩溃
3. 超时设置 30 秒，超时返回 fallback 静态数据
4. Step 2 和 Step 6 有 retry 逻辑（最多 2 次）
5. 准备 5–10 个 evaluation examples，手工验证问题生成和反馈质量

---

## 7. 开发优先级与工作量估算

| 模块 | 估算天数 | 依赖 |
|------|---------|------|
| Supabase 初始化 + 建表 + RLS | 0.5天 | — |
| 认证（登录/注册/Google OAuth） | 0.5天 | Supabase Auth |
| 面试前设置页 | 1天 | 认证 |
| AI Step 1–2（解析+问题生成） | 1.5天 | 设置页 |
| 面试会话页（文字交互） | 1.5天 | Step 1–2 |
| AI Step 3（追问判断） | 0.5天 | 会话页 |
| AI Step 4–5（反馈 Agent） | 1.5天 | 会话页 |
| 反馈页 | 1天 | Step 4–5 |
| 答案库（保存+列表+编辑） | 1天 | 反馈页 |
| Landing Page | 0.5天 | — |
| 个人主页 | 0.5天 | 所有模块 |
| 联调测试 + Demo 准备 | 1.5天 | 全部 |
| **合计** | **11天** | |

---

## 8. 错误状态处理原则

统一的错误处理规范，避免各模块自行处理导致体验不一致。

### 8.1 错误分级

| 级别 | 定义 | 处理方式 |
|------|------|---------|
| **Fatal** | 用户无法继续当前流程 | 全屏错误状态 + 明确出口 |
| **Recoverable** | 当前操作失败，可以重试 | inline 提示 + 重试按钮 |
| **Silent** | 非核心功能失败，不影响主流程 | 静默降级，不打扰用户 |

### 8.2 各模块关键错误场景

**面试会话：**

| 场景 | 级别 | 处理 |
|------|------|------|
| Whisper 转写失败 | Recoverable | 显示「Transcription failed — type your answer instead」，自动切换文字输入模式 |
| AI 追问判断超时（>10s） | Recoverable | 跳过追问，直接进入下一题，不告知用户（Silent 降级） |
| 面试中网络断开 | Fatal | 显示「Connection lost — your answers so far have been saved」+ 「Resume session」按钮 |
| 面试官自然语音不可用 | Silent | 静默降级，只显示面试官问题文本；候选人口语作答入口仍保留 |

**反馈生成：**

| 场景 | 级别 | 处理 |
|------|------|------|
| feedback_status = failed | Recoverable | 过渡页显示「Something went wrong — [Try again] [Go to dashboard]」|
| 单个 Agent 失败 | Recoverable | 重试该 Agent（最多 2 次），失败后用 fallback 静态数据填充对应视角 |
| 轮询超时（>60s） | Fatal | 显示「Taking longer than expected — we'll notify you when ready」（MVP 阶段简化为重试按钮）|

**设置页：**

| 场景 | 级别 | 处理 |
|------|------|------|
| Step 1–2 AI 解析失败 | Recoverable | 过渡页显示「Couldn't analyze your profile — [Try again]」|
| 问题生成失败 | Fatal | 返回设置页，显示「Something went wrong — please try again」|

### 8.3 会话恢复（成本最小方案）

用户关闭浏览器后重新进入，如果有 `status = 'in_progress'` 的 session：

**检测时机：** 用户进入 `/setup` 页面时检查。

**提示方式：**
```
┌─────────────────────────────────────┐
│  You have an unfinished session     │
│  Resume Deep Dive · Started 2h ago  │
│                                     │
│  [Continue]  [Start new session]    │
└─────────────────────────────────────┘
```

**Continue 行为：** 跳转到 `/session/[id]/interview`，前端从数据库读取已有的 exchanges，恢复到上次中断的题目位置。

**Start new session 行为：** 将旧 session 的 `status` 更新为 `'abandoned'`，进入正常设置流程。

**不做的事：** 不自动恢复，不做复杂的状态同步，不提示已回答几题。

### 8.4 通用 UI 原则

- 错误文案用第一人称「Something went wrong」，不用技术术语（不显示 error code 给用户）
- Fatal 错误必须提供出口（重试 or 返回上一页 or 去 dashboard），不能让用户卡死
- Recoverable 错误的重试按钮在原位显示，不跳转页面
- Silent 降级必须不影响用户感知，如果降级会导致体验明显变差，升级为 Recoverable

---

## 9. AI 质量控制体系

OfferUp 的核心体验由多个 AI 模块串联构成：简历/JD 解析、`fit_map` 生成、问题生成、追问判断、总体反馈、单题反馈、答案 polish。质量控制不能只依赖“prompt 写得好”，必须把每个模块做成可评估、可观测、可回滚的 workflow。

本章定义 AI workflow 的技术质量控制。产品层面的“合格 / 有效 / 优秀”分级门槛见《OfferUp — Product Evaluation Metrics》。发布决策必须同时满足产品价值门槛和本章的技术稳定性门槛。

### 9.1 AI 模块清单与质量目标

| 模块 | 主要目标 | 质量风险 | MVP 控制方式 |
|------|----------|----------|--------------|
| Resume/JD parsing | 正确提取候选人经历、岗位要求、语言、级别 | 漏掉关键经历；误解岗位；抽取过泛 | 结构化 schema + 固定 eval cases |
| fit_map generation | 建立候选人与岗位的匹配/缺口地图 | 过度推断；把简历没有的能力当事实 | 要求 evidence 字段，所有判断绑定来源文本 |
| Question generation | 生成具体、贴合简历/JD、可回答的问题 | 问题空泛；重复；过难/过易；和 focus 不匹配 | 题库参考 + 去重校验 + category/level 检查 |
| Follow-up decision | 判断是否追问，并生成自然追问 | 追问太多；追问重复；忽略好回答 | follow_up_intensity 上限 + 当前 intent 覆盖检查 |
| Overall feedback | 快速给出总体表现与下一步建议 | 评价漂移；过度严厉/过度鼓励 | 统一评分 rubric + summary schema |
| Per-question feedback | 逐题指出信号、缺口和改进策略 | 泛泛而谈；没有引用具体回答；评分不一致 | 每条反馈必须引用 answer evidence |
| Skill signal aggregation | 跨 session 累积用户能力强弱标签 | 标签体系混乱；弱点追踪不可解释 | weak_signal_tags + user_skill_signals 计数 |
| Answer polish | 把用户回答改成更强表达 | 编造经历；改变事实；语气不像本人 | fact-preserving prompt + diff/说明字段 |

### 9.2 Prompt、Schema、Rubric 三件套

每个 AI workflow 必须同时有三类资产：

1. Prompt：定义角色、输入、输出、禁止事项。
2. Schema：用 zod 校验 JSON 输出，缺字段时走修复或 fallback。
3. Rubric：定义好坏标准，尤其是评分、追问、polish 的判断尺度。

规则：
- Prompt 不能只写自然语言要求，必须给 JSON schema 示例。
- 所有主观评价必须带 evidence，例如引用简历片段、JD 要求或用户回答内容。
- 评分统一使用 1-5，并定义每个分数代表什么。
- `weak_signal_tags` 使用能力维度词表，不使用题型标签；题型标签回答“这是什么题”，能力标签回答“用户哪里弱”。
- 不能让模型直接决定数据库状态，只能返回结构化建议，由 workflow 代码更新状态。
- Prompt 和 schema 要版本化，例如 `feedback_v1`、`polish_v1`，写入 `question_generation_meta` 或 feedback meta，方便回滚和对比。

### 9.3 Eval Set：小而硬的测试集

MVP 至少准备 10-15 个固定 evaluation cases，而不是等真实用户反馈才发现质量问题。

建议覆盖：
- 简历很强但 JD 很泛。
- 简历很弱但 JD 要求很高。
- 无 JD，只选择 generic role。
- 非母语英文、语法错误但内容有效。
- 回答很短，缺少结果。
- 回答很长但没有重点。
- 用户说 “we did” 但没有说明个人贡献。
- 用户回答和问题无关。
- 行为面试、动机面试、文化协作、情景题各至少 1-2 个。
- Polish 场景中，原回答信息不足，模型必须拒绝编造。
- Mentor 增量价值 case：给定同一份 Interviewer feedback，判断 Mentor 是否提供了新增价值，而不是换个语气复述。

每个 eval case 记录：
- 输入：resume/JD/setup/exchanges。
- 期望：问题是否具体、追问是否必要、反馈是否引用证据、是否有幻觉。
- 人工评分：1-5。
- 失败原因标签：generic、hallucination、too_harsh、too_soft、wrong_level、repetitive、slow、invalid_json。

MVP 不需要自动化复杂评测，但每次改 prompt/model 前，至少手动跑这一组 case。

Mentor 专项 rubric：
- 如果 Mentor 只是把 `missing_signals` 换一种温和说法重复一遍，不及格。
- Mentor 必须至少提供一个 Interviewer 不会自然给出的增量：
  1. 认知翻译：解释“为什么面试官会这样听/这样判断”。
  2. 示范改写：给出下一次可以直接练习的表达句。
- 最理想的 Mentor 输出同时包含二者：先翻译面试官心理，再给用户一句可以练的改法。
- Mentor 可以更教练化，但不能添加用户没提供过的事实、指标或经历。

### 9.4 速度、成本与体验策略

速度策略：
- 创建面试时：优先生成 3 个主问题，不生成所有可能追问。
- 面试中：追问判断输出保持短 JSON，目标 1-3 秒。
- 反馈页：总体反馈先生成，单题反馈渐进生成。
- 面试官语音：文字先展示，语音作为增强层，不阻塞会话。

成本策略：
- DeepSeek V3 作为默认模型。
- 高价值、低频模块才考虑升级更强模型，例如最终反馈或 polish。
- STT 成本通常高于文本 LLM 成本，必须限制单次录音长度。MVP 单次回答硬上限 5 分钟，建议 2 分钟后 UI 轻提示收束。
- 对完全相同输入的 demo/test workflow 可以缓存；真实用户面试不应跨用户复用 AI 结果。

缓存与限流：
- 可以缓存 question_library 查询和 demo fallback。
- 可以缓存同一 session 的 `fit_map`、questions、feedback，不重复生成。
- 不建议缓存追问判断，因为它依赖最新 exchanges。
- 每个用户需要 credit + 简单 rate limit，防止重复点击或恶意刷 AI 成本。
- Credit 是主要成本控制；rate limit 是防滥用保护，不能替代 ledger。

### 9.5 稳定性与一致性

一致性来自“同一张地图 + 同一套 rubric”：
- Step 1 的 `fit_map` 是后续出题、追问、反馈的共同上下文。
- 所有反馈都应回到同一套 focus_type、level、language 和 interviewer_agent。
- Mentor feedback 可以更教练化，但不能推翻 Interviewer feedback 的事实判断。
- 如果两个 Agent 视角冲突，Mentor 应解释“为什么面试官会这样听到”，而不是给出相反结论。
- `language_note` 只在语法、措辞或表达方式影响面试官理解、可信度或专业感时填写；如果只是小语法、小口音或无关紧要的措辞，不填。
- 语言反馈必须服务面试结果，不做英语老师式逐句批改。

稳定性来自 workflow 代码：
- 超时、retry、schema repair、fallback 都在 workflow 层处理。
- 每次 AI 调用记录：model、prompt_version、duration_ms、input_size、output_size、status、error_type。
- 用户可见错误不显示技术细节；后台日志保留完整错误类型。

### 9.6 常见失败模式

这类 AI 面试产品最常见的失败模式：

- 问题太泛：像通用题库，不像基于用户简历/JD 生成。
- 问题太长：用户听完忘了问题是什么。
- 追问机械：每题都追问“can you give more detail”，没有真正听回答。
- 追问过度：用户已经答完整了还继续问，体验像审讯。
- 反馈空泛：只说“be more specific”，没有指出哪一句、怎么改。
- 反馈幻觉：把用户没说过的项目、指标、能力写进评价。
- 评分漂移：同样水平的回答，有时 2 分有时 4 分。
- Polish 编造：为了让答案更强，偷偷添加不存在的结果或数字。
- 语音链路拖慢节奏：用户说完后等待太久，打断口语练习状态。
- 失败不可恢复：AI 一次失败导致整场面试卡死。
- Demo 看起来很好，真实用户很差：因为 demo fallback 和真实数据路径不是同一套质量控制。

### 9.7 MVP 验收标准

MVP 阶段不追求“AI 完美”，但必须达到：

- 90% 以上 AI 输出通过 schema validation。
- 追问判断 P95 延迟小于 5 秒。
- 总体反馈 P95 可见时间小于 12 秒。
- 每场面试至少 2/3 主问题必须明显引用用户简历或 JD。
- 单题反馈必须包含至少 1 条具体 evidence。
- Answer polish 不得添加用户未提供的事实、数字或经历。
- 真实用户生产环境不得静默展示 demo fallback。

### 9.8 AI 技术选型边界：RAG、LangGraph、Agents、Realtime

MVP 不按“流行技术清单”堆栈，而按产品问题选择技术。

| 技术 | 是否用于 MVP | OfferUp 中的判断 |
|------|--------------|------------------|
| Structured Outputs / JSON schema | 必须用 | 所有 AI 输出都要可校验、可存库、可重试 |
| Prompt versioning | 必须用 | 每次 prompt 改动要能追踪质量变化和回滚 |
| Eval set | 必须用 | 用 10-15 个固定 case 控制出题、追问、反馈、polish 质量 |
| Lightweight retrieval | 必须用 | 从 `question_library` 按 category/level 取参考题；这是轻量 RAG，不需要向量库 |
| Vector RAG | 暂不需要 | MVP 资料量小，主要上下文来自用户简历/JD/回答；后续题库、公司库、行业知识库变大后再加 |
| LangGraph | 暂不需要 | 当前 workflow 是固定步骤，Next.js Route Handlers + DB 状态机足够；后续如果出现长时、多分支、可恢复 agent，再评估 |
| LangSmith / tracing 平台 | MVP 接入 | 用来观察 prompt 输入输出、耗时、错误、版本差异和 eval case 表现；不参与用户主流程决策 |
| Realtime voice agent | P1/P2 评估 | MVP 先做录音转文字 + 文本追问；如果要真正实时打断、低延迟语音对话，再升级 |
| Fine-tuning | 暂不需要 | 数据还不够，先用 prompt + eval + rubric；等积累高质量标注后再考虑 |
| Multi-agent framework | 暂不需要 | Interviewer/Mentor 是两个视角，不等于需要复杂 agent 框架；workflow 代码显式串联更可控 |

**MVP 推荐架构：**

```text
Typed workflow functions
  + prompt templates
  + zod schemas
  + Supabase state machine
  + question_library lightweight retrieval
  + LangSmith tracing
  + evaluation cases
```

这套架构比 LangGraph/RAG 全家桶更轻，但保留升级路径。

**什么时候升级到 Vector RAG：**
- 题库超过几百题，按 category/level 已经不够精准。
- 要引入公司面经、行业知识、岗位能力模型等外部知识库。
- 用户问“我这个回答适合德国 B2B SaaS PM 吗”之类需要检索领域资料的问题。
- 需要给反馈提供来源引用。

**什么时候升级到 LangGraph：**
- AI workflow 出现多分支循环，代码状态机开始难维护。
- 反馈生成要跨多个后台任务恢复、暂停、继续。
- 需要 human-in-the-loop 审阅 AI 状态。
- 需要可视化 trace 每一步 agent 的输入/输出和状态变化。

**什么时候升级到 Realtime Voice：**
- 用户需要自然口语来回，而不是“按住说一段 -> 等转写 -> 等追问”。
- 需要低延迟插话、打断、实时纠错。
- 口语练习的产品价值明显高于成本增加。

MVP 的底线是：先把结构化 AI workflow 做稳，不要过早引入重编排框架。复杂框架应该解决已经出现的复杂性，而不是提前制造复杂性。

### 9.9 LangSmith 接入方案

LangSmith 在 MVP 中作为 AI observability 层接入，用来帮助调试 prompt、比较模型、观察延迟和失败模式。它不参与产品决策，也不能成为用户流程的硬依赖。

参考配置来自 LangSmith 官方 tracing 文档：通过 `LANGSMITH_TRACING`、`LANGSMITH_API_KEY`、`LANGSMITH_PROJECT` 控制 tracing；serverless 环境建议让 traces 在函数结束前 flush。

**项目命名：**

```text
LANGSMITH_PROJECT=offerup-mvp-local       # local dev
LANGSMITH_PROJECT=offerup-mvp-preview     # Vercel preview
LANGSMITH_PROJECT=offerup-mvp-production  # production
```

**必须 trace 的 workflow：**

| Workflow | Run name | Tags |
|----------|----------|------|
| Resume/JD parsing + fit_map | `fit_map.generate` | `fit_map`, `setup`, `v1` |
| Question generation | `questions.generate` | `questions`, `setup`, `v1` |
| Follow-up decision | `followup.decide` | `followup`, `session`, `v1` |
| Overall feedback | `feedback.summary` | `feedback`, `summary`, `v1` |
| Per-question interviewer feedback | `feedback.interviewer.question` | `feedback`, `interviewer`, `v1` |
| Per-question mentor feedback | `feedback.mentor.question` | `feedback`, `mentor`, `v1` |
| Answer polish | `answer.polish` | `polish`, `bank`, `v1` |
| STT transcription | `voice.transcribe` | `voice`, `stt`, `v1` |

**每条 trace 的 metadata：**

```typescript
{
  session_id,
  user_id_hash,
  workflow_name,
  prompt_version,
  schema_version,
  model,
  focus_type,
  level,
  language,
  duration_ms,
  input_tokens_estimate,
  output_tokens_estimate,
  status,        // success | validation_failed | retry_success | failed | fallback
  error_type
}
```

**隐私与脱敏规则：**

- 不把原始 `user_id` 发到 LangSmith，只发 `user_id_hash`。
- Production 默认不发送完整简历、JD、音频、用户原始回答到 LangSmith；只发送摘要、长度、hash、schema 输出和错误类型。
- Local/dev 可以开启 `LANGSMITH_CAPTURE_RAW_IO=true` 调试完整 prompt，但该变量不得在 production 开启。
- 如果需要排查真实用户问题，应先得到用户同意，再临时开启更详细 tracing。
- Secret keys、邮箱、电话、地址等 PII 必须在 trace 前 redaction。

**本地 wrapper 约束：**

```typescript
// lib/ai/observability/langsmith.ts
export async function traceAiWorkflow<T>(
  name: string,
  metadata: AiTraceMetadata,
  fn: () => Promise<T>
): Promise<T> {
  // If LangSmith env is missing, run fn() directly.
  // If tracing is enabled, create a LangSmith run with sanitized inputs/outputs.
  // Never let tracing failure fail the product workflow.
}
```

规则：
- Workflow 只能调用 `traceAiWorkflow`，不要直接散落调用 LangSmith SDK。
- tracing 失败只能写 server log，不能让用户请求失败。
- 每个 retry 作为同一个 root run 下的 child span，方便看第一次失败和第二次成功的差异。
- Eval cases 也要打到 LangSmith，tag 加 `eval`，和真实用户 traces 分项目或分 tag 隔离。

**MVP 验收：**

- 本地开发跑完一次完整 demo 后，LangSmith 中能看到 5 条以上 AI workflow traces。
- 每条 trace 能看到 run name、model、prompt_version、duration、status。
- 故意让一个 schema validation 失败时，LangSmith 能看到 `validation_failed`。
- 关掉 LangSmith env 后，产品流程仍然完整可用。

---

## 10. Demo Fallback 数据结构

Demo fallback 只服务本地演示和 `DEMO_MODE=true`。生产环境中，真实用户的 AI 失败不能静默替换成 demo 内容；应显示可重试错误，或使用明确标注的、基于用户输入文本生成的轻量 fallback。

```typescript
// lib/fallback-demo.ts
export const DEMO_SESSION = {
  session: {
    id: 'demo-session-001',
    focus_type: 'resume',
    level: 'junior',
    interviewer_agent: 'hiring_manager',
  },
  questions: [
    {
      chain_index: 0,
      main_question: "Walk me through the product analytics dashboard project on your resume.",
      exchanges: [
        { role: 'interviewer', content: "Walk me through the product analytics dashboard project.", is_followup: false },
        { role: 'candidate', content: "We built a dashboard to help the team track user engagement...", is_followup: false },
        { role: 'interviewer', content: "You said 'we' — what specifically was your contribution?", is_followup: true },
        { role: 'candidate', content: "I was responsible for defining the metrics and working with engineering...", is_followup: false },
      ],
      interviewer_feedback: {
        heard_as: "A team member who contributed to a project, but ownership is unclear.",
        positive_signals: ["Mentioned specific metrics", "Cross-functional collaboration"],
        missing_signals: ["Personal decision-making", "Quantified impact"],
        score: 3
      },
      mentor_feedback: {
        what_was_lost: "Your actual ownership and the specific decisions you made",
        better_strategy: "Start with 'I led...' and name one key decision you personally made",
        language_tip: "Replace 'we built' with 'I drove the initiative to build'"
      }
    }
  ],
  global_feedback: { ... }
}
```

---

*本文档配合《OfferUp MVP PRD》《Agent 设计规格》《设置页规格》使用。*
*技术选型和数据库结构一旦确认，开发过程中不应随意更改表结构。*
