# OfferUp — Multi-Agent 反馈系统设计规格

**文档性质** PRD 附录，与主 PRD 配套使用  
**更新时间** 2026-06-08（v1.2：并行改串行；成本表统一为 DeepSeek）

---

## 1. 核心设计原则

每次面试结束后，系统固定产出**两个视角的反馈**：

| 视角 | 身份 | 是否固定 | 核心任务 |
|------|------|---------|---------|
| 面试官视角 | HR Agent / Hiring Manager Agent / 综合 Agent | **动态**，由训练模式决定 | 评估候选人当前表现，模拟真实面试官的感知 |
| 成长导师视角 | Mentor Agent | **固定**，每次必有 | 识别 gap，给出可执行的提升路径 |

两个视角**串行运行**：Interviewer Agent 先执行，Mentor Agent 以其输出作为参考输入再执行。面试结束后批量处理，用户等待 15–25 秒后看到完整反馈页。串行保证 Mentor 能引用面试官的感知结果，反馈质量高于并行。

---

## 2. 面试官 Agent 身份映射规则

### 2.1 Mode 1 专项练习（5 个欧洲面试场景专项）

用户在设置页选择题型，系统自动映射对应的面试官 Agent。题型设计基于欧洲 B2B SaaS 面试场景（Celonis、Personio、SAP 生态等）。

| focus_type | 中文名 | 英文标签 | 映射 Agent | 映射原因 | MVP 状态 |
|-----------|--------|---------|----------|---------|---------|
| `resume_deep_dive` | 简历深挖 | Resume Deep Dive | Hiring Manager Agent | 项目细节、ownership、impact 由用人经理评估 | ✅ P0 |
| `behavioral` | 行为测试 | Behavioral (STAR) | HR Agent | 行为题是 HR 初筛的核心工具，考察过去行为模式 | ✅ P0 |
| `motivation_fit` | 动机与背景 | Motivation & Fit | HR Agent | 动机真实性、职业规划、为何选择欧洲/德国，HR 主导 | ✅ P0 |
| `culture_collaboration` | 文化与协作 | Culture & Collaboration | 综合 Agent（HR + HM） | 欧洲公司对团队协作权重极高，需双视角评估 | 🔒 P1 |
| `situational` | 情景判断 | Situational / Case | Hiring Manager Agent | 假设场景决策，考察业务判断，用人经理主导 | 🔒 P1 |

**欧洲面试场景说明：**
- 德国 B2B SaaS 面试比美国更重视「务实证明」，不喜欢夸大叙述，STAR 格式被广泛接受
- 「文化与协作」在欧洲权重高于美国，候选人需要表现协作而非个人英雄主义
- 「动机与背景」会追问国际背景（为什么来德国、语言计划、长期意向），非母语候选人尤其需要练习
- 「情景判断」在 PM 岗位（Werkstudent 及以上）越来越常见，但题型复杂，P1 实现

**MVP 阶段混合题型处理：**
若未来支持用户选择多个专项，使用**综合 Agent**（兼顾 HR 和 HM 视角）。MVP 阶段单选，不涉及此逻辑。

### 2.2 Mode 2 全流程模拟（V2，当前占位）

每个 Round 对应固定角色，规划如下（MVP 不实现，prompt 设计预留结构）：

| Round | 典型名称 | 面试官 Agent | 欧洲场景说明 |
|-------|---------|------------|------------|
| Round 1 | HR Screening | HR Agent | 动机、背景、语言能力初筛 |
| Round 2 | Functional / Case | Hiring Manager Agent | 简历深挖 + 情景判断 |
| Round 3 | Culture / Team Fit | 综合 Agent | 团队协作、工作风格、价值观契合 |
| Round 4+ | 根据公司定制 | 可扩展 | — |

---

## 3. 各 Agent 详细设计

### 3.1 HR Agent

**身份设定 prompt 核心：**
> 你是一位有 5 年以上经验的企业 HR，负责初筛候选人。你的评估重点是：候选人的职业叙述是否清晰、岗位动机是否真实、沟通风格是否专业、外语表达是否达到工作要求。你不负责评估技术能力的深度。

**评估维度（结构化输出）：**

```json
{
  "agent_type": "hr",
  "per_question": [
    {
      "question_id": "q1",
      "heard_as": "招聘官实际听到的内容（用第一人称描述感知）",
      "positive_signals": ["信号1", "信号2"],
      "missing_signals": ["缺失信号1"],
      "language_note": "外语表达问题（如有）",
      "score": 3
    }
  ],
  "overall": {
    "summary": "整体印象（2–3句话）",
    "would_advance": true,
    "top_strength": "最突出的优势",
    "top_concern": "最大的顾虑"
  }
}
```

**评估重点：**
- 职业动机的真实性和一致性
- 沟通结构是否清晰（STAR 框架等）
- 外语表达的专业度和自然度
- 是否存在背稿感或模板化表达
- 岗位匹配度的表面信号（不深入技术细节）

---

### 3.2 Hiring Manager Agent

**身份设定 prompt 核心：**
> 你是一位有 8 年以上经验的技术/业务团队负责人，负责评估候选人是否有足够的实际工作能力。你的评估重点是：项目经验的深度和真实性、决策逻辑是否清晰、是否有真实的 ownership 和 impact、能否独立解决团队面临的问题。

**评估维度（结构化输出）：**

```json
{
  "agent_type": "hiring_manager",
  "per_question": [
    {
      "question_id": "q1",
      "heard_as": "用人经理实际听到的内容",
      "ownership_signal": "low | medium | high",
      "impact_clarity": "low | medium | high",
      "decision_logic": "是否展示了清晰的决策过程",
      "missing_depth": ["缺失的深度点"],
      "score": 3
    }
  ],
  "overall": {
    "summary": "整体能力印象",
    "hire_confidence": "low | medium | high",
    "strongest_evidence": "最有说服力的经历",
    "biggest_gap": "最明显的能力缺口"
  }
}
```

**评估重点：**
- 项目 ownership：候选人是在主导还是在执行？
- Impact 量化：有没有具体数字或结果？
- 决策逻辑：面对问题时为什么这么做，有没有权衡？
- 技术/业务判断：回答是否展示了真实的思考而非背诵？
- 与 JD 要求的实际匹配度（深层）

---

### 3.3 综合 Agent（MVP 默认 fallback）

**使用场景：** 用户混合选择多个题型时，或 Mode 2 特殊 Round。

**身份设定 prompt 核心：**
> 你同时扮演 HR 和用人经理的双重视角，综合评估候选人的职业表达和实际能力。在反馈中明确区分「HR 关注点」和「用人经理关注点」。

**输出结构：** 合并 HR Agent 和 Hiring Manager Agent 的输出格式，在 `overall` 层增加 `hr_perspective` 和 `hm_perspective` 两个子字段。

---

### 3.4 Mentor Agent（固定，每次必有）

**身份设定 prompt 核心：**
> 你是候选人的职业成长导师，了解他/她的完整简历背景。你不是在评估候选人「是否通过面试」，而是在帮助候选人「下一次如何表现得更好」。你的反馈应当具体、可执行、有优先级。你也关注外语表达的提升，但不仅限于语言——回答策略、叙述结构、心理准备都在你的关注范围内。

**输入：** 候选人简历 + JD + 面试完整记录 + 两个面试官 Agent 的评估结果（作为参考，不是依赖）

**评估维度（结构化输出）：**

```json
{
  "agent_type": "mentor",
  "per_question": [
    {
      "question_id": "q1",
      "what_was_lost": "这道题中，候选人本可以展示但没有展示的内容",
      "better_strategy": "针对这道题，下次可以怎么回答（策略层面）",
      "language_tip": "外语表达的具体提升建议（如有）"
    }
  ],
  "overall": {
    "top_gap": "当前最大的短板（1个，具体）",
    "priority_1": {
      "issue": "问题描述",
      "action": "具体可执行的练习或改进动作",
      "example": "示例（如有）"
    },
    "priority_2": {
      "issue": "问题描述",
      "action": "具体可执行的练习或改进动作"
    },
    "encouragement": "基于简历和本次表现，客观指出候选人真正的优势（不是泛泛鼓励）"
  }
}
```

**Mentor Agent 的关键约束（prompt 中必须明确）：**
- 建议必须具体，禁止输出「多练习」「更自信」这类无效建议
- 每个 priority 必须包含可执行的 action，不是描述问题
- 语言建议要指向具体的表达方式，不是「提升英语水平」
- 对候选人的 encouragement 必须基于真实证据，不能虚构优点

---

## 4. 反馈页面数据结构（完整 JSON schema）

面试结束后，Interviewer Agent 与 Mentor Agent 串行运行完毕，Aggregator 将输出合并为以下结构，供前端反馈页渲染。前端核心展示使用 `answer_signal` / `interviewer_heard` / `next_version_should_include` 三段式字段；原始 Agent 字段保留在 `raw_*` 中，便于后续 prompt 调优和 debug。

```json
{
  "session_id": "uuid",
  "interviewer_agent": "hr | hiring_manager | combined",
  "completed_at": "ISO timestamp",

  "per_question_feedback": [
    {
      "question_id": "q1",
      "question_text": "原问题",
      "user_answer": "用户回答文本",
      "answer_signal": "候选人这段回答实际传递出的信号",
      "interviewer_heard": "面试官实际听到并形成的感知",
      "next_version_should_include": [
        "下一版回答应加入的具体内容1",
        "下一版回答应加入的具体内容2"
      ],

      "raw_interviewer_view": {
        "heard_as": "...",
        "positive_signals": [],
        "missing_signals": [],
        "language_note": "...",
        "score": 3
      },

      "raw_mentor_view": {
        "what_was_lost": "...",
        "better_strategy": "...",
        "language_tip": "..."
      }
    }
  ],

  "global_feedback": {
    "interviewer_overall": {
      "summary": "...",
      "top_strength": "...",
      "top_concern": "...",
      "would_advance": true,
      "overall_score": 3.2
    },

    "mentor_overall": {
      "top_gap": "...",
      "priority_1": { "issue": "...", "action": "...", "example": "..." },
      "priority_2": { "issue": "...", "action": "..." },
      "encouragement": "..."
    }
  }
}
```

---

## 5. Prompt 工程要求

### 5.1 输入 context 构建

每个 Agent 收到的 context 结构如下，**顺序固定**，不能混乱：

```
[系统角色设定]
你是 [角色描述]。你的评估对象是一位正在练习面试的非母语求职者。

[候选人背景]
简历摘要：{candidate_summary}
目标岗位：{job_title} at {company_name}
岗位核心要求：{jd_key_requirements}

[本次面试记录]
训练模式：{mode} - {focus_type}
问题数量：{total_questions}

{逐题记录}
Q1: {question_text}
A1: {user_answer}

Q2: {question_text}
A2: {user_answer}
...

[输出要求]
请严格按照以下 JSON schema 输出，不要输出任何额外文字：
{schema}
```

### 5.2 质量控制要求

每个 Agent 的 prompt 必须包含以下约束段落：

**禁止输出的内容（negative examples）：**
```
❌ "你的回答很好，但可以更具体" （无信息量）
❌ "建议多练习口语表达" （不可执行）
❌ "你展示了很强的团队合作能力" （没有基于具体回答的证据）
```

**要求输出的内容（positive examples）：**
```
✅ "你提到了项目结果，但没有量化：下次可以说'减少了约30%的处理时间'而不是'提升了效率'"
✅ "这道题测试的是 ownership，但你的回答中主语经常是'我们'——下次改为'I initiated'并说明你具体做了什么"
✅ "你的德语回答中出现了3次'eigentlich'，这在专业语境中会显得不确定——可以直接陈述'Der Grund dafür war...'"
```

### 5.3 稳定输出保障

- 所有 Agent 强制 JSON 输出，在 API 调用时设置 `response_format` 或 prompt 末尾明确要求
- 后端对每个字段做 schema validation，缺失字段用默认值填充，不崩溃
- 准备 5–10 个 evaluation examples（输入 + 期望输出），用于手工验证 prompt 质量
- 针对非英语/德语回答（中文夹杂等），在 prompt 中明确说明处理方式：分析内容逻辑，语言建议单独标注

---

## 6. 成本估算（单次面试，3 题）

> 模型统一为 DeepSeek V3，定价约 $0.14/1M input tokens，$0.28/1M output tokens。

| 步骤 | 模型 | 估算 tokens | 估算成本 |
|------|------|------------|---------|
| 输入解析（简历+JD） | DeepSeek V3 | ~1500 in / 500 out | ~$0.0004 |
| 问题生成（3题） | DeepSeek V3 | ~2000 in / 800 out | ~$0.0005 |
| 追问生成（3次） | DeepSeek V3 | ~3×600 in / 200 out | ~$0.0004 |
| Interviewer Agent（逐题+全局） | DeepSeek V3 | ~4000 in / 1200 out | ~$0.0009 |
| Mentor Agent（逐题+全局，含 Interviewer 输出） | DeepSeek V3 | ~5000 in / 1500 out | ~$0.001 |
| Whisper STT（5分钟语音，P1） | whisper-1 | — | ~$0.030 |
| **单次总计（纯文字）** | | | **~$0.003** |
| **单次总计（含语音 P1）** | | | **~$0.033** |

100 次 seed user 测试总成本：纯文字约 **$0.30**，含语音约 **$3.3**，完全可控。

---

## 7. MVP 阶段简化策略

1 人 12 天的约束下，Agent 系统按以下顺序实现：

**Week 1（先跑通链路）：**
- 使用**综合 Agent**代替 HR / HM 分化，一个 prompt 覆盖面试官视角
- Mentor Agent 单独实现，这是核心差异化点，不能省
- 两个 Agent 串行运行：先 Interviewer Agent，再 Mentor Agent（Mentor 输入包含 Interviewer 输出）

**Week 2（提升质量）：**
- 将综合 Agent 拆分为 HR Agent 和 Hiring Manager Agent
- 实现题型→身份的映射逻辑
- 添加 evaluation examples，手工验证输出质量
- 增加 fallback：某个 Agent 超时或格式错误时，用备用静态数据填充

**Demo 保底方案：**
- 准备 1 套完整的 hardcode 反馈数据（针对 demo case）
- 如果 API 在演示时失败，直接展示 hardcode 结果，功能流程完全一致

---

*本文档配合《OfferUp MVP PRD》使用，专注 Agent 层设计细节。*
