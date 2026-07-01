# OfferUp — Answer Bank 完整功能规格

**文档性质** 功能规格文档，指导前端开发和数据模型设计  
**版本** v1.1  
**更新时间** 2026-06-18  
**关联文档** 主 PRD · 技术架构文档 · 反馈模块规格

---

## 1. 模块定位

Answer Bank 是用户的**个人答案资产库**。

它不是练习日志（不是自动归档所有回答），而是用户**主动选择保存**的、他认为值得复用的答案。每条记录的核心价值是：用户可以在下次面试前回顾，直接使用或基于此继续打磨。

MVP 范围拆分：

- **P0：保存动作**。从反馈页保存原始回答；从 Answer Polish 保存 polished answer；如果同一题已有记录，Polish 保存为新的版本，不覆盖旧版本。
- **P1：完整资产库体验**。列表、搜索、筛选、详情页、编辑 `bank_answer`、删除、重置等。

命名边界：
- **Question Library** 指系统公共题库。
- **Answer Bank** 指用户自己保存的回答资产。
- 文档和数据库中统一使用 `Answer Bank` 和 `bank_answer`。

---

## 2. 数据模型

### 2.1 三层答案字段

每条 Bank 记录包含三个答案字段，职责严格分离：

| 字段 | 含义 | 来源 | 可编辑 |
|------|------|------|--------|
| `original_answer` | 面试时的完整对话链（含追问） | question_chains.exchanges | ❌ 永远只读 |
| `polished_answer` | AI 重新设计的更强回答版本 | Answer Polish Agent 输出 | ❌ 只读，MVP 不在 Bank 内重新生成 |
| `bank_answer` | 用户在 Bank 页面维护的最终版 | 初始值来自保存时选择的版本 | ✅ 可编辑 |

### 2.2 bank_answer 的初始值规则

```
从反馈页「Save to Bank」    → bank_answer = original_answer（的 exchanges）
从 Polish 结果「Save to Bank」→ 创建新版本，bank_answer = polished_answer（的 exchanges）
```

用户保存后可以在 Bank 页面修改 `bank_answer`，`original_answer` 和 `polished_answer` 永远保持保存时的状态。

### 2.2.1 版本规则

同一题可以有多个保存版本。版本用于保护用户已经保存过的答案，避免 Polish 结果覆盖旧内容。

- 第一次从反馈页保存原始回答：创建 `version_number = 1`。
- 后续从 Polish 结果保存：创建新的 Answer Bank 记录，继承相同 `answer_group_id`，`version_number = max + 1`。
- 旧版本的 `original_answer`、`polished_answer`、`bank_answer` 都不被覆盖。
- P1 详情页可以在版本之间切换；每个版本内部仍然有 Original / Polished / Your version 三视图。

### 2.3 exchanges 数据结构

三个答案字段都以 exchanges 数组存储，不是纯文本：

```json
{
  "exchanges": [
    {
      "role": "interviewer",
      "content": "Walk me through your product analytics project.",
      "is_followup": false
    },
    {
      "role": "candidate",
      "content": "I led the initiative to build a dashboard...",
      "is_followup": false
    },
    {
      "role": "interviewer",
      "content": "What was your specific contribution to the decision?",
      "is_followup": true
    },
    {
      "role": "candidate",
      "content": "I personally decided to prioritize retention...",
      "is_followup": false
    }
  ]
}
```

**原因：** 面试是对话，上下文很重要。用户在 Bank 回看时，看到完整对话链比只看自己的回答更有意义——追问的存在本身就说明了第一轮回答的问题。

### 2.4 polished_answer 的特殊结构

Polish 不是逐句润色，而是**重新设计整条问题链的最优路径**。有两种输出形态：

**情况 A：第一轮回答就完整，追问消失**
```json
{
  "exchanges": [
    { "role": "interviewer", "content": "原问题", "is_followup": false },
    { "role": "candidate",   "content": "包含了所有必要信号的完整回答", "is_followup": false }
  ],
  "polish_note": "Simplified to single round — follow-up was triggered by incomplete ownership signal in the original answer"
}
```

**情况 B：追问有价值，保留但优化双方回答**
```json
{
  "exchanges": [
    { "role": "interviewer", "content": "原问题", "is_followup": false },
    { "role": "candidate",   "content": "优化后的第一轮回答", "is_followup": false },
    { "role": "interviewer", "content": "有价值的深挖追问", "is_followup": true },
    { "role": "candidate",   "content": "优化后的追问回答", "is_followup": false }
  ],
  "polish_note": "Retained follow-up — it surfaces genuinely valuable depth about business impact"
}
```

**Polish Agent 判断逻辑：**
```
如果 missing_signals 都可以在第一轮自然包含
  → 单轮 Polish，追问消失

如果原始追问揭示了有价值的深度信息
  → 保留追问，优化两轮回答

如果原始追问仅是因为第一轮不完整才触发
  → 第一轮 Polish 到位，追问消失
```

### 2.5 完整数据库表结构

```sql
create table answer_bank (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users not null,
  chain_id         uuid references question_chains,
  -- chain_id nullable：未来支持用户手动创建时为 null

  answer_group_id  uuid not null default gen_random_uuid(),
  -- 同一题/同一保存对象的版本分组；第一版自动生成，后续版本沿用

  version_number   integer not null default 1,
  -- 同一 answer_group_id 下从 1 递增

  -- 问题信息
  question_text    text not null,
  tag              text not null,
  -- 'resume_deep_dive' | 'behavioral' | 'motivation_fit'
  -- | 'culture_collaboration' | 'situational' | 'other'

  -- 三层答案（均为 jsonb，存 exchanges 数组）
  original_answer  jsonb not null,
  -- { exchanges: [...] }
  -- 只读，永不修改

  polished_answer  jsonb,
  -- { exchanges: [...], polish_note: string }
  -- 用户点击 Answer Polish 后生成
  -- 只读，MVP 不在 Bank 内重新生成

  bank_answer      jsonb not null,
  -- { exchanges: [...] }
  -- 初始值 = original_answer 或 polished_answer
  -- 用户可编辑

  -- 元信息
  source           text not null default 'original',
  -- 'original'：从反馈页保存
  -- 'polished'：从 Polish 页保存

  saved_at         timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);

-- RLS
alter table answer_bank enable row level security;
create policy "users can only access own bank"
  on answer_bank for all using (auth.uid() = user_id);

-- 索引
create index idx_bank_user_tag on answer_bank(user_id, tag);
create index idx_bank_user_saved on answer_bank(user_id, saved_at desc);
create index idx_bank_user_group_version on answer_bank(user_id, answer_group_id, version_number desc);
```

---

## 3. 保存入口规格

### 3.1 入口一：反馈页单题区域

位置：每道题反馈区底部

按钮：`Save to Bank`（实边框，主要操作）

触发后：
1. 创建 answer_bank 记录
2. `original_answer` = 该题的完整 exchanges
3. `bank_answer` = `original_answer`（初始值）
4. `source` = `'original'`
5. `answer_group_id` = 自动生成的新分组 id
6. `version_number` = 1
7. 显示成功 toast：「Saved to your Answer Bank」
8. 按钮状态变为「Saved ✓」（灰色，不可重复保存原始回答）

### 3.2 入口二：Answer Polish 结果

位置：Polish 结果展示区底部

按钮：`Save polished version to Bank`

触发后：
1. 如果该题已有 Bank 记录 → 创建一个新的版本，继承 `answer_group_id`，`version_number = max + 1`，`bank_answer` = `polished_answer`，`source` = `'polished'`
2. 如果该题没有 Bank 记录 → 创建新记录，`answer_group_id` 自动生成新分组，`version_number = 1`，`bank_answer` = `polished_answer`，`source` = `'polished'`
3. 不覆盖旧版本的 `bank_answer`、`polished_answer` 或 `original_answer`

---

## 4. Answer Bank 页面规格

### 4.1 页面结构

```
Answer Bank 页面
├── 页面头部          ← 标题 + 搜索框 + tag 筛选栏
├── 记录列表          ← 平铺，按保存时间倒序
│   └── 每条记录卡片  ← 点击展开详情
└── 空状态            ← 无记录时的引导
```

### 4.2 页面头部

**搜索框：**
- 实时搜索，对 `question_text` 和 `bank_answer.exchanges` 中候选人回答的文字匹配
- placeholder：「Search questions or answers...」

**Tag 筛选栏（水平滚动）：**

```
[All]  [Resume Deep Dive]  [Behavioral]  [Motivation & Fit]  [Culture]  [Other]
```

- 默认选中「All」
- 点击 tag 筛选，与搜索框叠加生效
- 每个 tag 显示该 tag 下的记录数量

### 4.3 记录列表

每条记录在列表中显示为卡片，包含：

```
┌──────────────────────────────────────────────────────┐
│  [Resume Deep Dive]          Saved May 17            │
│                                                      │
│  Walk me through your product analytics project.    │
│                                                      │
│  I led the initiative to build a dashboard...       │  ← bank_answer 第一轮候选人回答，截断
│                                                      │
│  [polished ✓]                           [Delete]    │  ← 有 polished_answer 时显示标签
└──────────────────────────────────────────────────────┘
```

字段说明：
- Tag 标签：左上角，颜色编码（和反馈页一致）
- 保存日期：右上角，小字
- `question_text`：加粗，完整显示
- `bank_answer` 预览：候选人第一轮回答，截断至 2 行
- `[polished ✓]` 标签：有 `polished_answer` 时显示，灰色小标签
- `[Delete]` 按钮：右下角，点击有确认弹窗

**点击卡片任意位置**→ 进入详情页。

### 4.4 空状态

```
No answers saved yet.

Start a practice session and save answers
you want to revisit and refine.

[Start practicing →]
```

---

## 5. 详情页规格

### 5.1 页面结构

```
详情页
├── 导航              ← 「← Answer Bank」
├── 题目头部          ← 问题文本 + tag
├── 版本切换栏         ← Original / Polished（有时）/ Your version
├── 对话链展示         ← 当前版本的完整 exchanges
├── 编辑区            ← 仅 bank_answer 可编辑
└── 操作栏            ← Save changes / Reset to original / Reset to polished
```

### 5.2 版本切换栏

```
[ Original ]  [ Polished ]  [ Your version ]
```

- `Original`：显示 `original_answer` 的 exchanges，只读
- `Polished`：有 `polished_answer` 时显示，只读；无时灰色不可点击
- `Your version`：显示 `bank_answer`，可编辑（默认选中）

**设计意图：** 让用户能在三个版本之间对比，理解「原始 → AI 优化 → 我的版本」的演进，而不是只看到一个答案。

### 5.3 对话链展示与编辑

**显示方式：** 类似聊天记录，面试官气泡和候选人气泡交替。追问标注「Follow-up」小标签。

**编辑规则（仅 Your version 标签下）：**
- 面试官的问题和追问：**显示但不可编辑**（灰色背景）
- 候选人的每条回答：**独立的 textarea，可编辑**

```
┌──────────────────────────────────────┐  面试官气泡（不可编辑）
│  Walk me through your project.       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐  候选人 textarea（可编辑）
│  I led the initiative to build...    │
│                                      │
│                                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐  追问气泡（不可编辑）
│  [Follow-up] What was your role...   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐  候选人 textarea（可编辑）
│  I personally decided to...          │
└──────────────────────────────────────┘
```

**编辑行为：**
- 实时编辑，不自动保存
- 有未保存修改时，离开页面有确认提示

### 5.4 操作栏

| 操作 | 行为 |
|------|------|
| `Save changes` | 保存当前 `bank_answer` 编辑内容，更新 `updated_at` |
| `Reset to original` | 将 `bank_answer` 重置为 `original_answer`，有确认弹窗 |
| `Reset to polished` | 将 `bank_answer` 重置为 `polished_answer`（仅有 polished 时显示），有确认弹窗 |

**设计指导：**
- `Save changes` 是主要操作，实边框按钮
- Reset 操作是次要的，虚线边框 + 灰色文字
- 重置前必须有确认弹窗，明确说明「This will replace your current version」

---

## 6. 功能边界（MVP）

### MVP 包含

- 从反馈页保存（P0）
- 从 Answer Polish 结果保存 polished answer（P0）
- Polish 保存为新版本，不覆盖旧版本（P0）
- 记录列表：平铺 + tag 筛选 + 搜索（P1）
- 详情页：版本切换 + 三视图切换 + 编辑 `bank_answer` + 保存 + 重置（P1）
- 删除记录（P1）

### MVP 不包含（V2）

- `polished_answer` 重新生成
- 备注字段
- 导出为 PDF
- 按岗位/公司筛选
- 手动新建记录（不来自面试）
- 排序方式切换（目前固定按保存时间倒序）

---

## 7. 设计指导汇总

### 信息层级

| 层级 | 内容 | UI 处理 |
|------|------|--------|
| **核心** | `bank_answer`（Your version）| 默认展示，可编辑 |
| **对照** | `original_answer` | 版本切换栏，只读 |
| **参考** | `polished_answer` | 版本切换栏，有时可用，只读 |
| **版本** | `version_number` / `answer_group_id` | P1 详情页切换不同保存版本 |
| **元信息** | tag、日期、来源 | 小字，灰色 |

### 核心设计原则

- Answer Bank 的主角是 `bank_answer`，不是 `original_answer`。用户进入详情页默认看到的是「Your version」，而不是「面试时说的话」
- 三版本并存是为了让用户理解自己「进步了多少」，Original 是起点，Polished 是参考，Your version 是目标
- 多个保存版本并存是为了保护旧答案。用户保存新的 Polish 结果时，不应失去此前已经认可过的版本
- 编辑只针对候选人回答，面试官问题不可编辑——这保证了对话链的语境完整性

### 禁止项

- 禁止 `original_answer` 任何形式的写入（保存后锁定）
- 禁止在列表页直接编辑（必须进详情页）
- 禁止重置操作没有确认弹窗
- 禁止删除操作没有确认弹窗
- 禁止搜索触发后端 API（纯前端过滤，无延迟）

---

## 8. 验收标准

### P0

- [ ] 从反馈页点击「Save to Bank」→ 创建记录，toast 提示成功
- [ ] 同一题重复点击「Save to Bank」→ 按钮变为「Saved ✓」，不创建重复记录
- [ ] `original_answer` = 该题完整 exchanges（含追问）
- [ ] `bank_answer` 初始值 = `original_answer`
- [ ] 从 Polish 结果保存已有题目 → 创建新版本，不覆盖旧版本
- [ ] 新版本继承同一 `answer_group_id`，`version_number` 正确递增

### P1

- [ ] Answer Bank 列表页正常加载，按保存时间倒序
- [ ] Tag 筛选正确过滤记录
- [ ] 搜索对 `question_text` 和候选人回答文字有效，纯前端实现
- [ ] 点击卡片进入详情页
- [ ] 详情页可切换不同保存版本
- [ ] 每个版本内：Original 和 Your version 正常切换
- [ ] Your version 标签下，候选人回答可编辑，面试官问题不可编辑
- [ ] Save changes → `bank_answer` 更新，`updated_at` 更新
- [ ] Reset to original → 确认弹窗 → 确认后 `bank_answer` 重置
- [ ] Delete → 确认弹窗 → 确认后记录删除，列表刷新

---

*本文档直接指导 Answer Bank 模块的前端开发和数据模型设计。*  
*`polished_answer` 的数据结构已同步更新至《技术架构文档》。*
