# OfferUp — 反馈模块完整规格

**文档性质** 功能规格文档，指导 Agent prompt 设计和前端开发  
**版本** v1.1  
**更新时间** 2026-06-08（v1.1：单题详情页完整规格）  
**关联文档** 主 PRD · Agent 设计规格 · 技术架构文档

---

## 1. 用户旅程

### 1.1 用户进入反馈页时的心理状态

面试刚结束，用户处于高度敏感状态：
- 有点紧张，不确定自己表现如何
- 想要被「看见」——希望反馈是针对自己的，不是通用模板
- 防御机制活跃——如果第一句话是批评，他会关闭
- 想知道三件事，有严格先后顺序：**我表现怎么样 → 哪里出了问题 → 我该怎么办**

### 1.2 反馈页阅读旅程（线性叙事，不是仪表盘）

```
用户点击「查看反馈」
        ↓
第一眼：整体判断
  — 面试官视角：「我给面试官留下了什么印象」
  — 1-2 句话，有结论，不是评分
  — 附：面试官的最终倾向（Yes/Maybe/No 或 Below/At/Above）
        ↓
第二眼：为什么是这个结论
  — 一强一弱，各有具体证据
  — 不是维度列表，是「发生了什么」
        ↓
第三眼：我该怎么办
  — Mentor 视角接棒
  — 先认可真实优势（不是安慰）
  — 唯一的优先行动，具体到可以立刻做
  — 维度评分作为参考出现在这里，不是主角
        ↓
第四眼：每道题入口
  — 列表形式，题目 + 分数
  — 点击进入独立的单题详情页
        ↓
底部 CTA
  — 主：Start new session
  — 次：Save all to bank
```

### 1.3 单题详情页旅程（独立页面）

```
用户点击某道题
        ↓
看到原始问题 + 自己的完整回答（含追问链）
        ↓
三栏对比结构：
  You signaled → Interviewer heard → Next version
        ↓
底部操作：
  Save to bank / Polish answer（MVP 可用）
```

---

## 2. 反馈页功能规格

### 2.1 页面结构总览

```
反馈页（全局视图）
├── 页面头部            ← 题型、面试官身份、日期
├── Block A：整体判断   ← 面试官视角，核心信息
├── Block B：一强一弱   ← 面试官视角，支撑信息
├── Block C：Mentor     ← Mentor 视角，行动导向
│   └── 维度评分        ← 参考信息，收在 Mentor 块内
└── Block D：题目列表   ← 入口，点击进单题详情页
    └── 底部 CTA
```

**设计原则：信息层级**

> **核心信息**（用户必须看到）：整体判断结论、一强一弱证据、唯一优先行动  
> **支撑信息**（帮助理解核心）：向 HM 汇报的那句话、Red flag / 风险说明  
> **参考信息**（有兴趣可深看）：维度评分条形图、题目分数列表  
> **操作入口**（驱动下一步）：Start new session、Save to bank、单题详情

---

### 2.2 页面头部

**字段：**

| 字段 | 来源 | 用途 |
|------|------|------|
| `focus_type_label` | session 配置 | 显示题型名称（Resume Deep Dive 等） |
| `interviewer_agent_label` | session 配置 | 显示面试官身份（Hiring Manager / HR） |
| `session_date` | session 记录 | 显示日期 |
| `overall_score` | Agent 输出 | 显示总分（辅助信息，小字） |

**设计指导：**
- 头部信息是定位信息，不是核心信息，用小号字 + 全大写处理
- 总分不在头部大字显示，避免用户第一眼只看数字

---

### 2.3 Block A：整体判断（核心信息）

**这是页面最重要的模块。**用户读完这里应该知道「面试官怎么看我」。

#### 根据 focus_type 渲染不同结构：

**HR 视角（motivation_fit / culture_collaboration）：**

| 字段 | 类型 | 含义 | 优先级 |
|------|------|------|--------|
| `hr_summary` | string | 向 HM 汇报时会说的那句话，1-2 句 | **核心** |
| `recommendation` | enum | Yes / Maybe / No | **核心** |
| `recommendation_reason` | string | 推荐或不推荐的主要原因，1 句 | 支撑 |

**HM 视角（resume_deep_dive / behavioral）：**

| 字段 | 类型 | 含义 | 优先级 |
|------|------|------|--------|
| `hm_summary` | string | 对候选人能力的定性评估，1-2 句 | **核心** |
| `assessed_level` | enum | Below expectations / At level / Above level | **核心** |
| `level_reason` | string | 做出这个判断的主要依据，1 句 | 支撑 |

**Agent prompt 约束：**
```
hr_summary / hm_summary 必须：
- 像面试官在复盘会上说的那种话，不是评分语言
- 有主语（"This candidate..."），不是标签罗列
- 包含一个具体的观察，不能是泛泛的印象
- 不超过 2 句话

禁止输出：
❌ "The candidate demonstrated strong communication skills"（太泛）
❌ "Score: 3.2/5 — Good but needs improvement"（评分语言）

要求输出：
✅ "Real project exposure is there, but the interviewer likely left 
    wondering who actually drove the work — ownership language was 
    consistently absent."
✅ "Strong on structure and outcome framing; the gap is decision logic — 
    answers described what happened but rarely explained the reasoning."
```

---

### 2.4 Block B：一强一弱（支撑信息）

**用途：** 解释 Block A 结论的来源，给用户「原来如此」的感觉。

| 字段 | 类型 | 含义 | 优先级 |
|------|------|------|--------|
| `strength_label` | string | 强项的名称，3-5 字 | **核心** |
| `strength_evidence` | string | 具体证据，引用回答中的内容 | **核心** |
| `weakness_label` | string | 弱项的名称，3-5 字 | **核心** |
| `weakness_evidence` | string | 具体证据，说明「为什么」这是弱项 | **核心** |
| `red_flag` | string \| null | 仅 HR 视角：是否有 red flag，有则说明 | 支撑 |
| `onboarding_risk` | string \| null | 仅 HM 视角：录用后第一个月的风险 | 支撑 |

**Agent prompt 约束：**
```
strength_evidence / weakness_evidence 必须：
- 有具体来源（"In Q1, you said..." / "Used 'we' in 8 of 11 answers"）
- 解释为什么这个证据支持结论
- 不能是泛泛描述

禁止：
❌ "You showed good understanding of the problem"
❌ "Ownership was weak"

要求：
✅ "In Q3, you named the specific metric (30% reduction) and explained 
    why you chose that target — that's the clearest ownership signal 
    in the session."
✅ "'We' appeared in 8 of 11 answers. The interviewer heard a team story, 
    not your story — it's impossible to tell what you personally led."
```

---

### 2.5 Block C：Mentor（行动导向）

**这是页面的行动模块。** 用户读完这里应该知道「下次我要做什么不一样」。

**重要设计约束：Mentor 永远先说优势，再说缺口。**
原因：用户处于脆弱状态，先认可才能让建议被接收。这条规则必须写进 prompt，不能让模型自己决定顺序。

#### 共用字段（所有题型）：

| 字段 | 类型 | 含义 | 优先级 |
|------|------|------|--------|
| `genuine_strength` | string | 基于证据的真实优势，不是安慰 | **核心** |
| `primary_gap` | string | 最大的能力缺口，1 个，有性质诊断 | **核心** |
| `priority_action` | string | 唯一的优先行动，具体到可以立刻执行 | **核心** |
| `next_practice` | string | 下一步练什么，具体到题型或练习方式 | 支撑 |
| `dimension_scores` | object | 4 个维度的评分和说明（见下） | 参考 |

#### 特殊字段（仅 culture_collaboration 题型）：

| 字段 | 类型 | 含义 | 优先级 |
|------|------|------|--------|
| `culture_context` | string | 解释为什么这个表达在欧洲面试语境下是错误信号 | **核心** |

**设计指导：** `culture_context` 是这道题类型里最重要的 Mentor 输出。用户往往不知道自己的表达「哪里错了」，只有理解了文化背景，建议才有意义。这个字段在 UI 上应该比其他字段更突出显示。

#### 维度评分（参考信息，收在 Mentor 块内）：

根据 focus_type 渲染不同的 4 个维度：

| focus_type | 维度 1 | 维度 2 | 维度 3 | 维度 4（共用） |
|-----------|--------|--------|--------|--------------|
| resume_deep_dive | Ownership clarity | Impact evidence | Decision logic | Language clarity |
| behavioral | Situation setup | Action specificity | Result tangibility | Language clarity |
| motivation_fit | Authenticity signal | Company research | Career narrative | Language clarity |
| culture_collaboration | Team framing | Conflict resolution | Adaptability | Language clarity |

每个维度的字段：

| 字段 | 类型 | 含义 |
|------|------|------|
| `label` | string | 维度名称 |
| `score` | int 1-5 | 评分 |
| `evidence` | string | 一句话说明为什么是这个分，有具体来源 |

**设计指导：** 维度评分是参考信息，不是主角。在 UI 上用小号字体 + 细条形图呈现，收在折叠区域或 Mentor 块底部。不在页面顶部大字显示。

**Agent prompt 约束：**
```
priority_action 必须：
- 具体到「下一步做什么」，不是「提升 X 能力」
- 如果可以，指向具体的问题（"Try rewriting Q1 and Q3 first"）
- 不超过 2 句话

禁止：
❌ "Practice using more specific examples"
❌ "Work on your ownership language"

要求：
✅ "In your next session, replace every 'we' with 'I led' or 'I decided', 
    then add one sentence explaining why you made that call. 
    Start with Q1 and Q3 — they're your weakest two."

genuine_strength 必须：
- 有具体证据支撑（引用回答中的内容）
- 不能是虚假鼓励
- 如果这次表现整体很差，说一个真实存在的小优势也行

禁止：
❌ "You showed great enthusiasm"（无证据）
❌ "Your English is improving"（太泛）

要求：
✅ "Your answer structure is genuinely strong — in every answer, 
    context, action, and result were all present and in order. 
    That's not a small thing; many candidates struggle with this."
```

---

### 2.6 Block D：题目列表（参考信息 + 入口）

**用途：** 让用户快速浏览每道题的表现，点击进入单题详情页。

| 字段 | 类型 | 含义 | 优先级 |
|------|------|------|--------|
| `chain_index` | int | 题目编号 | 参考 |
| `question_text` | string | 问题文本（截断显示） | 参考 |
| `score` | int 1-5 | 单题评分 | 参考 |
| `score_color` | — | 前端根据分数渲染颜色（1-2红/3黄/4-5绿） | — |

**设计指导：** 每行一题，分数右对齐，颜色编码让用户快速识别弱题。点击整行进入单题详情页，不在此展开内容。

---

## 3. 单题详情页功能规格

### 3.1 导航决策：跳转新页面

单题详情从全局反馈页**跳转新页面**，不在同一页往下展开。

原因：
- 全局叙事页有完整的阅读线索，展开单题会打断叙事
- 问题链（主问题 + 追问）内容量大，独立页面可以完整展示
- 用户在单题页完成阅读后，回全局页时导航状态清晰

导航路径：
```
全局反馈页 → 点击某道题 → 单题详情页 → 返回全局反馈页
```

---

### 3.2 页面阅读旅程

用户进入单题详情页的心理状态：已经知道整体结论，现在想搞清楚**这道题具体哪里出了问题**。

```
① 第一眼：这道题是什么，我说了什么
   — 问题文本（含考察意图）
   — 完整对话记录（主问题 + 所有追问，按时间顺序）

② 第二眼：面试官怎么看这道题
   — 我传递的信号（客观，不评判）
   — 面试官实际感知（指出偏差，核心价值）
   — 缺失的能力信号（本可以展示但没展示的）

③ 第三眼：Mentor 怎么帮我改
   — 缺口诊断（性质是什么）
   — 具体怎么改（针对这道题，不是通用建议）
   — 语言提示（如有外语表达问题）

④ 操作区
   — Save to bank（主要操作）
   — Polish answer（MVP 可用，点击后渐进展示 polished answer）
```

---

### 3.3 页面结构详细定义

```
单题详情页
├── 导航返回              ← 「← Back to feedback」
├── Block 0：题目头部     ← 题号、问题文本、考察意图
├── Block 1：对话记录     ← 完整问题链（主问题 + 追问 + 所有回答）
├── Block 2：面试官视角   ← 感知偏差（核心信息）
├── Block 3：Mentor 视角  ← 缺口诊断 + 怎么改（行动信息）
└── Block 4：操作区       ← Save to bank / Polish
```

**两个视角的分工：**
- Block 2 面试官：向后看——「你说了什么，对方听到了什么，缺了什么」
- Block 3 Mentor：向前看——「这个缺口是什么性质的，怎么具体修复」

---

### 3.4 字段定义

#### Block 0：题目头部

| 字段 | 来源 | 含义 | 优先级 |
|------|------|------|--------|
| `chain_index` | question_chains | 题号（Q1 / Q2 / Q3） | 支撑 |
| `question_text` | question_chains | 主问题完整文本 | **核心** |
| `question_intent` | question_chains | 这道题考察什么，1句话 | 支撑 |
| `focus_type_label` | session 配置 | 题型标签（Resume Deep Dive 等） | 支撑 |

**设计指导：**
- `question_text` 大字显示，是页面视觉锚点
- `question_intent` 小字显示在题目下方：「This question tests: ownership and decision logic」
- 让用户在看反馈之前先知道「面试官问这道题是为了测什么」，建立理解框架

---

#### Block 1：对话记录

| 字段 | 来源 | 含义 | 优先级 |
|------|------|------|--------|
| `exchanges` | question_chains | 完整对话数组，含 role / content / is_followup | **核心** |

**exchanges 数据结构：**
```json
[
  { "role": "interviewer", "content": "主问题文本", "is_followup": false },
  { "role": "candidate",   "content": "用户回答",   "is_followup": false },
  { "role": "interviewer", "content": "追问文本",   "is_followup": true  },
  { "role": "candidate",   "content": "用户追问回答", "is_followup": false }
]
```

**设计指导：**
- 面试官发言（蓝色或灰色气泡）和用户回答（白色气泡）交替显示，像聊天记录
- 追问用小标签标注「Follow-up」，与主问题视觉区分
- 这是反馈的「证据原文」，用户需要能回看自己说了什么，才能理解后面的反馈
- 对话记录是支撑信息，UI 上可以用折叠处理（默认展开，可收起）

---

#### Block 2：面试官视角（评估，向后看）

三个字段构成感知偏差的完整图谱，顺序固定：

| 字段 | 来源 | 含义 | 优先级 |
|------|------|------|--------|
| `you_signaled` | Interviewer Agent | 你实际传递的信号，客观描述 | **核心** |
| `interviewer_heard` | Interviewer Agent | 面试官实际感知，指出偏差 | **核心** |
| `missing_signals` | Interviewer Agent | 这道题本应展示但缺失的能力信号 | **核心** |
| `per_question_score` | Interviewer Agent | 单题评分 1-5 | 参考 |
| `language_note` | Interviewer Agent | 外语表达问题，如有 | 支撑 |

**三个字段的关系：**
```
you_signaled    → 「你说了什么」（事实）
interviewer_heard → 「对方听到了什么」（感知偏差，最有价值）
missing_signals → 「本可以说但没说的」（机会损失）
```

**设计指导：**
- `interviewer_heard` 是这个 Block 最重要的字段，UI 权重最高
- 三个字段用三列或三行呈现，视觉上明确分开，不混排
- `per_question_score` 小字显示在 Block 右上角，不是主角
- `language_note` 如果有，用不同颜色的小标签显示在 Block 底部

**Agent prompt 约束：**
```
you_signaled（客观，不评判）：
  ✅ "Team involvement, awareness of the churn problem, outcome orientation"
  ❌ "You did a decent job explaining the situation"（有评判）

interviewer_heard（指出感知偏差，这是核心）：
  ✅ "A contributor, not a driver — impossible to tell what you personally led"
  ✅ "The answer described what the team did, not what you decided"
  ❌ "Your answer was okay but lacked ownership"（太泛，没有指出具体偏差）

missing_signals（缺失的能力信号，具体到可验证）：
  ✅ "Personal decision-making — why did YOU choose this approach over alternatives?"
  ✅ "Quantified impact — what metric moved, by how much, because of your work?"
  ❌ "More specific examples"（不具体）
```

---

#### Block 3：Mentor 视角（行动，向前看）

| 字段 | 来源 | 含义 | 优先级 |
|------|------|------|--------|
| `gap_diagnosis` | Mentor Agent | 缺口的性质诊断，1句话 | **核心** |
| `how_to_fix` | Mentor Agent | 针对这道题的具体改进建议 | **核心** |
| `language_tip` | Mentor Agent | 外语表达的具体替换建议，如有 | 支撑 |

**三个字段的关系：**
```
gap_diagnosis → 「问题的根本原因是什么」（性质层面）
how_to_fix    → 「这道题具体怎么改」（操作层面）
language_tip  → 「有没有外语表达问题，怎么说更好」（语言层面）
```

**gap_diagnosis 的性质分类（帮助 Agent 输出更精准）：**

| 性质 | 含义 | 典型表现 |
|------|------|---------|
| 叙事问题 | 经历是真实的，但讲述方式让人听不清 | 主语模糊、时间线乱、结论缺失 |
| 结构问题 | 有内容但没有框架，面试官要自己拼图 | STAR 某个环节缺失、答题散漫 |
| 语言问题 | 内容对，但外语表达降低了可信度 | 翻译腔、hedging 过多、词汇单一 |
| 深度问题 | 停留在表面，没有展示决策和判断 | 只说做了什么，不说为什么 |
| 真实性问题 | 回答听起来是背出来的，不是经历出来的 | 过于完美、无细节、无情绪 |

**设计指导：**
- `gap_diagnosis` 是 Mentor Block 最重要的字段——让用户理解「根本原因是什么」比告诉他「怎么改」更有价值
- `how_to_fix` 必须针对这道题的具体内容，不能是通用建议
- `language_tip` 如果有，给出具体的替换示例（「用 'I initiated' 替换 'we started'」）

**Agent prompt 约束：**
```
gap_diagnosis（性质诊断，指向根本原因）：
  ✅ "Narrative problem — the experience is real, but the framing makes 
      it impossible to see what you personally owned"
  ✅ "Depth problem — you described the outcome but skipped the reasoning; 
      interviewers need to see how you think, not just what happened"
  ❌ "You need to be more specific"（没有诊断性质）

how_to_fix（针对这道题，操作层面）：
  ✅ "Rewrite the opening: instead of 'We built a dashboard', try 
      'I proposed building a dashboard because I noticed X pattern in 
      the data — here's what I decided and why'"
  ✅ "In the follow-up about the 30% target: name the specific reasoning 
      — why 30% and not 20% or 50%? That's the decision logic the 
      interviewer was looking for"
  ❌ "Practice using more concrete examples"（通用，没有针对这道题）

language_tip（具体替换，不是泛泛建议）：
  ✅ "'Make a decision' appeared 3 times — try: 'decide', 'commit to', 
      'choose X over Y because'"
  ❌ "Work on your English vocabulary"（无用）
```

---

#### Block 4：操作区

| 操作 | 状态 | 行为 |
|------|------|------|
| Save to bank | P0，可用 | 保存这道题的原始回答到答案库，显示成功 toast |
| Polish answer | P0，可用 | 点击后为当前题生成一版完整 polished answer，并可保存到 Answer Bank |

**设计指导：**
- Save to bank 是主要操作，用实边框按钮
- Polish answer 是次级但可用操作，用虚边框或低权重按钮；生成后先展示完整 polished answer，再用折叠区展示 why changed
- 操作区固定在页面底部，不随内容滚动消失

---

### 3.5 完整单题 Agent 输出 Schema 更新

在原有 per_question 数组里补充 Mentor 单题字段：

**Interviewer Agent per_question（更新）：**
```json
{
  "chain_index": 0,
  "you_signaled": "string — 客观描述传递的信号",
  "interviewer_heard": "string — 实际感知，指出偏差",
  "missing_signals": ["string — 缺失信号1", "string — 缺失信号2"],
  "per_question_score": 3,
  "language_note": "string | null"
}
```

**Mentor Agent per_question（更新）：**
```json
{
  "chain_index": 0,
  "gap_diagnosis": "string — 缺口性质诊断，1句话",
  "how_to_fix": "string — 针对这道题的具体改进建议",
  "language_tip": "string | null — 具体替换建议，无则 null"
}
```

---

## 4. 完整 Agent 输出 JSON Schema

### 4.1 HR 视角输出（motivation_fit / culture_collaboration）

```json
{
  "agent_type": "hr",
  "focus_type": "motivation_fit",

  "block_a": {
    "hr_summary": "string — 向 HM 汇报的那句话，1-2句，有具体观察",
    "recommendation": "yes | maybe | no",
    "recommendation_reason": "string — 主要原因，1句"
  },

  "block_b": {
    "strength_label": "string — 3-5字",
    "strength_evidence": "string — 有具体来源的证据",
    "weakness_label": "string — 3-5字",
    "weakness_evidence": "string — 有具体来源的证据",
    "red_flag": "string | null — 有则说明，无则 null"
  },

  "per_question": [
    {
      "chain_index": 0,
      "you_signaled": "string — 客观描述传递的信号，不评判",
      "interviewer_heard": "string — 实际感知，明确指出偏差",
      "missing_signals": ["string — 缺失信号1", "string — 缺失信号2"],
      "per_question_score": 3,
      "language_note": "string | null"
    }
  ]
}
```

### 4.2 HM 视角输出（resume_deep_dive / behavioral）

```json
{
  "agent_type": "hiring_manager",
  "focus_type": "resume_deep_dive",

  "block_a": {
    "hm_summary": "string — 能力定性评估，1-2句",
    "assessed_level": "below | at | above",
    "level_reason": "string — 判断依据，1句"
  },

  "block_b": {
    "strength_label": "string",
    "strength_evidence": "string",
    "weakness_label": "string",
    "weakness_evidence": "string",
    "onboarding_risk": "string | null — 录用后第一个月风险"
  },

  "per_question": [
    {
      "chain_index": 0,
      "you_signaled": "string — 客观描述传递的信号，不评判",
      "interviewer_heard": "string — 实际感知，明确指出偏差",
      "missing_signals": ["string — 缺失信号1", "string — 缺失信号2"],
      "per_question_score": 3,
      "language_note": "string | null"
    }
  ]
}
```

### 4.3 Mentor 输出（所有题型，结构一致）

```json
{
  "agent_type": "mentor",
  "focus_type": "resume_deep_dive",

  "block_c": {
    "genuine_strength": "string — 基于证据的真实优势，先说",
    "primary_gap": "string — 最大缺口，性质诊断",
    "priority_action": "string — 唯一优先行动，具体可执行",
    "next_practice": "string — 下一步练什么",
    "culture_context": "string | null — 仅 culture_collaboration 题型非 null",

    "dimension_scores": [
      {
        "label": "Ownership clarity",
        "score": 2,
        "evidence": "string — 一句话说明，有具体来源"
      },
      {
        "label": "Impact evidence",
        "score": 3,
        "evidence": "string"
      },
      {
        "label": "Decision logic",
        "score": 3,
        "evidence": "string"
      },
      {
        "label": "Language clarity",
        "score": 3,
        "evidence": "string"
      }
    ]
  },

  "per_question": [
    {
      "chain_index": 0,
      "gap_diagnosis": "string — 缺口性质诊断（叙事/结构/语言/深度/真实性），1句话",
      "how_to_fix": "string — 针对这道题的具体改进建议，可引用原回答内容",
      "language_tip": "string | null — 具体替换建议，无则 null"
    }
  ]
}
```

---

## 5. 设计指导汇总

### 信息层级规则

| 层级 | 内容 | UI 处理 |
|------|------|--------|
| **核心** | 整体结论、一强一弱证据、优先行动 | 正文字号，主色，充足留白 |
| **支撑** | 推荐理由、red flag、录用风险、文化语境 | 小字，次色，收在核心信息下方 |
| **参考** | 维度评分、题目分数列表 | 最小字，灰色，条形图辅助 |
| **操作** | CTA 按钮 | 独立区域，不与内容混排 |

### 视角切换规则

- HR 视角底部结论：`Would advance → Yes / Maybe / No`
- HM 视角底部结论：`Assessed level → Below / At / Above`
- Mentor 永远最后出场，永远先说优势

### Mentor 输出顺序（不可改变）

```
1. genuine_strength（先）
2. primary_gap（后）
3. priority_action
4. next_practice
5. dimension_scores（最后，参考用）
```

### 禁止项

**全局反馈页：**
- 禁止在页面顶部大字显示总分
- 禁止 Mentor 先说缺口
- 禁止没有具体证据的评估（「你的表达很好」不可接受）
- 禁止给超过 1 个优先行动建议
- 禁止在全局反馈页展开单题详情（点击进独立页面）

**单题详情页：**
- 禁止 `how_to_fix` 输出通用建议，必须引用这道题的具体内容
- 禁止 `gap_diagnosis` 只描述症状，必须指出性质（叙事/结构/语言/深度/真实性）
- 禁止 `language_tip` 输出「提升英语水平」这类无效建议，必须给出具体替换
- 禁止操作按钮在页面中间出现，操作区固定在底部

---

*本文档直接指导 Agent prompt 设计和反馈页前端开发。*  
*更新时同步检查：Agent 设计规格 · 主 PRD Section 3.5*
