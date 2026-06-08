# Interview Mentor — 技术架构与数据库设计

**文档性质** 技术规格文档  
**版本** v1.1  
**更新时间** 2026-06-08（v1.2：删 NextAuth；加 feedback_status；数据库约束；Agent 改串行）  
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
| 语音转文字 | OpenAI Whisper API | Web Speech API | 多语言准确率高，$0.006/分钟，P1 功能 |
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

写入：interview_sessions（含 interviewer_agent 身份映射结果）
```

无 JD 只有通用角色时：job_requirements 和 gap_points 用该角色通用 benchmark 填充。

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
前端：展示问题文本（TTS 预生成音频可选）
用户：文字输入 / 录音→Whisper转写→确认（P1）
提交：{ session_id, chain_index, answer_text }

写入：追加到 question_chains.exchanges
  { role: "candidate", content: answer_text, is_followup: false }
```

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

**Step 5 · 过渡页 + 后台反馈生成** `POST /api/session/feedback`

```
前端：显示「感谢完成面试，正在生成你的专属反馈...」
     轮询 GET /api/session/:id/feedback-status（每 2 秒一次）
     收到 feedback_status = 'ready' → 显示「查看反馈」按钮（用户手动点击）
     收到 feedback_status = 'failed' → 显示「生成失败，点击重试」按钮

feedback_status 状态机：
  pending     → 面试结束，尚未触发生成
  generating  → POST /api/session/feedback 已触发，正在生成
  ready       → 两个 Agent 均完成，数据写入完毕
  failed      → 任一 Agent 失败且 retry 耗尽

后台串行执行：
  Step 6a · Interviewer Agent（先执行）
    输入：fit_map + 所有 question_chains.exchanges + focus_type + level + language
    身份：HR / Hiring Manager / 综合（由 focus_type 映射）
    输出：逐题 interviewer_feedback + 全局 hr_overall
    写入：question_chains.interviewer_feedback · session_feedback.hr_overall

  Step 6b · Mentor Agent（后执行，输入包含 6a 输出）
    输入：同上 + Step 6a 完整输出
    身份：固定
    输出：逐题 mentor_feedback + 全局 mentor_overall
    写入：question_chains.mentor_feedback · session_feedback.mentor_overall

  完成后：interview_sessions.feedback_status → 'ready'
  失败时：interview_sessions.feedback_status → 'failed'，写入 feedback_error

预计等待时间：15–25 秒（串行）
```

**轮询接口：** `GET /api/session/:id/feedback-status`
```json
{ "feedback_status": "pending | generating | ready | failed", "feedback_error": null }
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
│   ├── login/page.tsx                → M2 登录
│   └── register/page.tsx            → M2 注册
├── setup/page.tsx                    → M3 面试前设置
├── session/
│   ├── [id]/
│   │   ├── call/page.tsx             → 来电动画
│   │   ├── interview/page.tsx        → M5 面试会话
│   │   └── feedback/page.tsx         → M6 反馈页
├── library/page.tsx                  → M10 题库
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
```

---

## 4. 数据库设计

### 4.1 设计原则

- 所有表都有 `user_id` 外键（Supabase RLS 行级安全基于此字段）
- AI 生成的结构化数据用 `jsonb` 存储（schema 变化时不需要迁移）
- 固定字段（用于过滤、排序、统计）用独立列
- `question_chains.exchanges` 存完整对话记录，保留追问上下文

### 4.2 表结构详细说明

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
  updated_at   timestamp with time zone default now(),

  constraint resumes_content_not_empty check (length(trim(content_text)) >= 100)
);
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
  updated_at   timestamp with time zone default now(),

  constraint jd_history_job_title_not_empty check (length(trim(job_title)) > 0)
);
```

---

#### `interview_sessions`
每次面试的完整配置和状态记录。

```sql
create table interview_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users on delete cascade not null,
  resume_id            uuid references resumes(id) on delete set null,        -- nullable，用通用角色时为空
  jd_id                uuid references jd_history(id) on delete set null,     -- nullable
  
  -- 面试配置
  mode                 text not null,   -- 'focused' | 'full_process'
  focus_type           text,            -- 'resume_deep_dive'|'behavioral'|'motivation_fit'|'culture_collaboration'|'situational'
  level                text not null,   -- 'junior' | 'mid' | 'senior'
  language             text not null default 'en',
  follow_up_intensity  text not null default 'medium', -- 'off'|'low'|'medium'|'high'
  interviewer_agent    text not null,   -- 'hr' | 'hiring_manager' | 'combined'
  
  -- 状态
  status               text not null default 'in_progress',
                                        -- 'in_progress'|'completed'|'abandoned'
  overall_score        int,             -- 1–5，完成后填入

  -- 反馈生成状态（异步机制必须字段）
  feedback_status      text not null default 'pending',
                                        -- 'pending'|'generating'|'ready'|'failed'
  feedback_error       text,            -- 失败时的错误信息，用于 UI 提示和 retry

  created_at           timestamp with time zone default now(),
  completed_at         timestamp with time zone,
  updated_at           timestamp with time zone default now(),

  constraint interview_sessions_mode_check
    check (mode in ('focused', 'full_process')),
  constraint interview_sessions_focus_type_check
    check (focus_type in ('resume_deep_dive','behavioral','motivation_fit','culture_collaboration','situational')),
  constraint interview_sessions_level_check
    check (level in ('junior','mid','senior')),
  constraint interview_sessions_language_check
    check (language in ('en','de')),
  constraint interview_sessions_follow_up_check
    check (follow_up_intensity in ('off','low','medium','high')),
  constraint interview_sessions_agent_check
    check (interviewer_agent in ('hr','hiring_manager','combined')),
  constraint interview_sessions_status_check
    check (status in ('in_progress','completed','abandoned')),
  constraint interview_sessions_feedback_status_check
    check (feedback_status in ('pending','generating','ready','failed')),
  constraint interview_sessions_score_check
    check (overall_score is null or overall_score between 1 and 5)
);

-- updated_at 自动更新 trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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
  session_id           uuid references interview_sessions(id) on delete cascade not null,
  chain_index          int not null,    -- 第几道主题（0-based）
  
  -- 问题内容
  main_question        text not null,
  question_intent      text,            -- AI 生成问题的意图说明
  
  -- 完整对话记录（含追问）
  -- 结构：[{role: 'interviewer'|'candidate', content: string, is_followup: bool}]
  exchanges            jsonb not null default '[]',
  
  -- AI 反馈（面试结束后批量填入）
  interviewer_feedback jsonb,
  -- 结构：{heard_as, positive_signals[], missing_signals[], language_note, score}
  
  mentor_feedback      jsonb,
  -- 结构：{what_was_lost, better_strategy, language_tip}
  
  score                int,             -- 1–5，由 interviewer agent 评分

  created_at           timestamp with time zone default now(),

  -- 约束：同一 session 内 chain_index 唯一
  unique (session_id, chain_index),
  constraint question_chains_index_check check (chain_index between 0 and 2),
  constraint question_chains_score_check check (score is null or score between 1 and 5),
  constraint question_chains_exchanges_array check (jsonb_typeof(exchanges) = 'array')
);
```

---

#### `session_feedback`
每次面试的全局反馈（两个 Agent 的整体评估）。

```sql
create table session_feedback (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references interview_sessions(id) on delete cascade not null unique,
  
  -- 面试官全局反馈
  interviewer_overall  jsonb,
  -- 结构：{summary, top_strength, top_concern, would_advance, overall_score}
  
  -- Mentor 全局反馈
  mentor_overall   jsonb,
  -- 结构：{top_gap, priority_1{issue,action,example}, priority_2{issue,action}, encouragement}
  
  overall_score    int,                 -- 综合评分 1–5
  created_at       timestamp with time zone default now(),

  constraint session_feedback_score_check
    check (overall_score is null or overall_score between 1 and 5)
);
```

---

#### `answer_bank`
用户的个人答案库，三层字段设计。

```sql
create table answer_bank (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete cascade not null,
  chain_id         uuid references question_chains(id) on delete set null,  -- nullable，手动创建时为空
  
  -- 问题信息
  question_text    text not null,
  category         text not null,
  -- 'resume_deep_dive'|'behavioral'|'motivation_fit'|'culture_collaboration'|'situational'|'other'
  
  -- 三层答案字段（职责分离）
  original_answer  text,
  -- 面试时的原始回答，只读，来自 question_chains.exchanges，永不修改
  
  polished_answer  text,
  -- AI Polish 后的版本，nullable（Polish 功能开放后才有值）
  
  saved_answer     text not null,
  -- 用户在答案库里维护的「最终版」
  -- 初始值 = original_answer
  -- 用户可手动编辑
  -- 或一键采用 polished_answer 内容
  
  note             text,               -- 用户自己加的备注
  saved_at         timestamp with time zone default now(),
  updated_at       timestamp with time zone default now(),

  constraint answer_bank_category_check
    check (category in ('resume_deep_dive','behavioral','motivation_fit','culture_collaboration','situational','other')),
  constraint answer_bank_question_not_empty check (length(trim(question_text)) > 0),
  constraint answer_bank_saved_answer_not_empty check (length(trim(saved_answer)) > 0),
  constraint answer_bank_unique_chain_per_user unique (user_id, chain_id)
);
```

**三层字段的操作逻辑：**

```
保存时：
  saved_answer = original_answer（默认）

Polish 开放后，用户点「采用 Polish 版本」：
  saved_answer = polished_answer（覆盖）

用户手动编辑：
  saved_answer = 用户输入内容（自由编辑）

original_answer 永远不变，作为对照参考。
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
  question_text text not null,
  language      text not null default 'en',
  tags          jsonb default '[]',     -- ['ownership','impact','conflict'...]
  created_at    timestamp with time zone default now(),

  constraint question_library_category_check
    check (category in ('resume_deep_dive','behavioral','motivation_fit','culture_collaboration','situational')),
  constraint question_library_difficulty_check
    check (difficulty in ('junior','mid','senior')),
  constraint question_library_language_check
    check (language in ('en','de')),
  constraint question_library_question_not_empty check (length(trim(question_text)) > 0)
);
```

**题库与面试的关系：**
AI 生成问题时，将题库作为「参考池」而非「固定题目」——AI 可以基于题库中的题目结合用户简历做变种，保证个性化的同时有质量基准。

---

### 4.3 RLS 行级安全策略

Supabase 的 RLS 确保每个用户只能读写自己的数据：

```sql
-- 用户私有表：读写必须限定 auth.uid() = user_id
alter table resumes enable row level security;

create policy "users can read own resumes"
  on resumes for select
  using (auth.uid() = user_id);

create policy "users can insert own resumes"
  on resumes for insert
  with check (auth.uid() = user_id);

create policy "users can update own resumes"
  on resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own resumes"
  on resumes for delete
  using (auth.uid() = user_id);

-- interview_sessions / jd_history / answer_bank 同理，必须同时写 using + with check。
-- question_chains 和 session_feedback 通过 session_id 关联 interview_sessions 做归属校验。
alter table question_chains enable row level security;

create policy "users can read own question chains"
  on question_chains for select
  using (
    exists (
      select 1 from interview_sessions s
      where s.id = question_chains.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "users can insert own question chains"
  on question_chains for insert
  with check (
    exists (
      select 1 from interview_sessions s
      where s.id = question_chains.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "users can update own question chains"
  on question_chains for update
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

-- question_library 是公共只读表，所有人可读
alter table question_library enable row level security;

create policy "anyone can read question library"
  on question_library for select
  using (true);
```

---

### 4.4 关键索引

```sql
-- 面试历史查询（个人主页、历史记录）
create index idx_sessions_user_created
  on interview_sessions(user_id, created_at desc);

-- 问题链查询（反馈页加载）
create index idx_chains_session
  on question_chains(session_id, chain_index);

-- 答案库查询（分类筛选）
create index idx_bank_user_category
  on answer_bank(user_id, category);

-- 题库查询（按分类+难度抽题）
create index idx_library_category_difficulty
  on question_library(category, difficulty);
```

---

## 5. AI 工作流详细设计

### 5.1 调用步骤总览

| 步骤 | 触发时机 | 模型 | 预估 tokens out | 写入位置 |
|------|---------|------|----------------|---------|
| Step 1 输入解析 | 用户提交设置 | DeepSeek V3 | ~500 | interview_sessions |
| Step 2 问题生成 | Step 1 完成后 | DeepSeek V3 | ~800 | question_chains × 3 |
| Step 3 追问判断 | 每次用户回答后 | DeepSeek V3 | ~200 | question_chains.exchanges |
| Step 6a Interviewer Agent | 面试结束后（先执行） | DeepSeek V3 | ~600 × 3题 | interviewer_feedback + hr_overall |
| Step 6b Mentor Agent | Step 6a 完成后（后执行） | DeepSeek V3 | ~600 × 3题 | mentor_feedback + mentor_overall |

Step 6a 和 6b 串行运行，不并行。Mentor Agent 输入包含 Interviewer Agent 的完整输出。

### 5.2 模型选择逻辑

```
速度优先（解析、追问判断）→ DeepSeek V3
质量优先（问题生成、反馈 Agent）→ DeepSeek V3（MVP 阶段统一，稳定后可升 R1）
```

MVP 阶段统一用 DeepSeek V3，稳定后根据反馈质量决定是否对 Step 6 升级到 R1。

### 5.3 fit_map schema（Step 1 输出）

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

### 5.4 追问判断 prompt 核心约束

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

### 5.5 输出稳定性保障

所有 AI 调用必须：
1. prompt 末尾明确要求 JSON 输出并提供 schema 示例
2. 后端对每个必填字段做 validation，缺失时用默认值填充，不崩溃
3. 超时设置 30 秒，超时返回 fallback 静态数据
4. Step 2 和 Step 6 有 retry 逻辑（最多 2 次）
5. 准备 5–10 个 evaluation examples，手工验证问题生成和反馈质量

---

## 6. 开发优先级与工作量估算

| 模块 | 估算天数 | 依赖 |
|------|---------|------|
| Supabase 初始化 + 建表 + RLS | 0.5天 | — |
| 认证（登录/注册/Google OAuth） | 0.75天 | Supabase Auth |
| 面试前设置页 | 1天 | 认证 |
| AI Step 1–2（解析+问题生成） | 1.5天 | 设置页 |
| 面试会话页（文字交互） | 1.5天 | Step 1–2 |
| AI Step 3（追问判断） | 0.5天 | 会话页 |
| AI Step 4–5（反馈 Agent） | 1.5天 | 会话页 |
| 反馈页 | 1天 | Step 4–5 |
| 答案库（保存+基础列表+编辑） | 1天 | 反馈页 |
| Landing Page | 0.5天 | — |
| 个人主页 | 0.5天 | 所有模块 |
| 联调测试 + Demo 准备 | 1.5天 | 全部 |
| **合计** | **11天** | |

---

## 7. Demo Fallback 数据结构

API 失败时，前端读取本地 fallback JSON，保证 demo 流程完整。

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

*本文档配合《Interview Mentor MVP PRD》《Agent 设计规格》《设置页规格》使用。*
*技术选型和数据库结构一旦确认，开发过程中不应随意更改表结构。*
