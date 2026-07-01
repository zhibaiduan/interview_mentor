# OfferUp — Answer Polish 完整功能规格

**文档性质** 功能规格文档，指导前端、API、Agent prompt 和 Answer Bank 数据流  
**版本** v1.1  
**更新时间** 2026-06-18  
**关联文档** 主 PRD · 反馈模块规格 · Answer Bank 规格 · 技术架构文档

---

## 1. 模块定位

Answer Polish 是 MVP 功能。

它不是自动批改所有答案，也不是承诺生成“完美答案”。它的作用是：当用户看到某一道题的反馈后，可以点击一次，把当前回答改写成一版更清楚、更有面试信号、更适合目标岗位语境的完整回答。

产品承诺应使用：

- A stronger version
- A clearer version
- A more interview-ready draft
- Polish into a better answer

禁止使用：

- Perfect answer
- Final answer
- Guaranteed best answer

---

## 2. 触发入口

### 2.1 入口位置

MVP 入口放在单题反馈区域或单题详情页的操作区。

按钮文案：

```text
Polish this answer
```

### 2.2 触发规则

- 用户点击后才生成，不自动生成。
- 每次只生成当前选中题目的 Polish。
- 不批量生成所有题目。
- 每次点击可以重新生成当前题目的最新结果。
- Polish 生成结果在当前 UI 中可以替换上一次临时结果；用户点击保存时，如果该题已存在 Answer Bank 记录，则保存为新的 Bank 版本，不覆盖旧版本。

---

## 3. 输入数据

Answer Polish Agent 至少需要以下输入：

```json
{
  "question_text": "Original interview question",
  "exchanges": [
    {
      "role": "interviewer",
      "content": "Question or follow-up",
      "is_followup": false
    },
    {
      "role": "candidate",
      "content": "User answer",
      "is_followup": false
    }
  ],
  "feedback_context": {
    "you_signaled": "What the answer signaled",
    "interviewer_heard": "What the interviewer heard",
    "missing_signals": ["Missing signal"],
    "gap_diagnosis": "Root issue",
    "how_to_fix": "Concrete improvement advice"
  },
  "session_context": {
    "focus_type": "resume_deep_dive | behavioral | motivation_fit | other",
    "target_role": "Target role or JD summary",
    "level": "junior | mid | senior",
    "language": "en"
  }
}
```

---

## 4. 输出数据

Primary output 是一版完整 polished answer。

MVP 必需字段：

```json
{
  "polished_answer": {
    "exchanges": [
      {
        "role": "interviewer",
        "content": "Original question",
        "is_followup": false
      },
      {
        "role": "candidate",
        "content": "Complete improved answer",
        "is_followup": false
      }
    ],
    "polish_note": "Short note describing whether the answer was simplified or kept as a chain."
  },
  "why_changed": [
    "Short reason explaining why this version is stronger."
  ]
}
```

MVP 可选字段：

```json
{
  "reuse_phrases": [
    "Reusable phrase 1",
    "Reusable phrase 2"
  ]
}
```

Reusable phrases 不是主输出，不能抢 polished answer 的视觉权重。

---

## 5. 对话链处理规则

Polish 不是逐字润色，而是重新设计这道题的最佳回答路径。

### 情况 A：第一轮回答可以完整承载信号

如果缺失信号可以自然放进第一轮回答：

- 输出单轮 polished answer。
- 原来的追问可以消失。
- `polish_note` 说明追问为什么不再需要。

### 情况 B：追问本身有价值

如果原始追问揭示了有价值的深度信息：

- 保留追问链。
- 优化候选人的第一轮回答和追问回答。
- `polish_note` 说明为什么保留追问。

---

## 6. UI 展示规则

Answer Polish 必须使用渐进式披露。

推荐流程：

1. 用户点击 `Polish this answer`。
2. 按钮进入 loading 状态。
3. 首先展示完整 polished answer。
4. 在答案下方展示次级折叠区：

```text
Why this version works better
```

5. 用户展开后看到 `why_changed`。
6. 底部提供：

```text
Save polished version to Answer Bank
```

不要一开始同时展示长解释、标签、短语库和完整答案。

---

## 7. 保存到 Answer Bank

用户点击保存后：

- 如果该题没有 Answer Bank 记录：
  - 创建 `answer_bank` 记录。
  - `original_answer` = 原始 exchanges。
  - `polished_answer` = Polish 输出。
  - `bank_answer` = `polished_answer`。
  - `source` = `polished`。

- 如果该题已有 Answer Bank 记录：
  - 创建一个新的 Answer Bank 版本。
  - `answer_group_id` 继承已有记录的分组。
  - `version_number` = 当前分组最大版本号 + 1。
  - `original_answer` 仍然保存原始 exchanges，作为该版本的只读对照。
  - `polished_answer` = 当前 Polish 输出。
  - `bank_answer` = `polished_answer`。
  - 不覆盖旧版本的 `bank_answer`、`polished_answer` 或 `original_answer`。

MVP 不需要在 Polish 流程内提供编辑功能。编辑 `bank_answer` 是 Answer Bank 详情页的能力。

---

## 8. 验收标准

- [ ] 用户可以从单题反馈或单题详情点击 `Polish this answer`。
- [ ] 每次只生成当前题的 Polish。
- [ ] Polish 不自动批量生成。
- [ ] 首屏优先展示完整 polished answer。
- [ ] `why_changed` 作为次级信息渐进展示。
- [ ] 用户可以把 polished answer 保存到 Answer Bank。
- [ ] 如果该题没有 Answer Bank 记录，保存后 `bank_answer` 使用 `polished_answer` 初始化。
- [ ] 如果该题已有 Answer Bank 记录，保存为新的 Bank 版本，不覆盖旧版本。
- [ ] UI 文案不承诺 perfect / final / guaranteed best answer。
