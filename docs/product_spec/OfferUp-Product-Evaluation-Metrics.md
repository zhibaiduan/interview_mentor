# OfferUp — Product Evaluation Metrics

**文档性质** 产品质量评估规格  
**版本** v1.1  
**状态** Source of truth for MVP quality gates  
**更新时间** 2026-06-19（v1.1：补充 L1/L2/L3 指标层级，明确 MVP 主验证指标为 Mentor 建议采纳 + 下一步清晰度）  
**关联文档** 主 PRD · 技术架构文档 · Agent 设计规格 · 反馈模块规格

---

## 1. 评估目的

OfferUp 的 MVP 不是只验证“功能是否做完”，也不是只验证“AI 有没有稳定输出”。它要验证：

> 非母语技术求职者，是否能通过一次基于真实简历和 JD 的模拟面试，获得足够具体、可信、可行动的反馈，并愿意继续练习或保存答案资产？

因此产品成色分三层：

| 层级 | 评估问题 | 决策含义 |
|---|---|---|
| 合格 | 产品是否能稳定跑通，不误导用户，不破坏信任？ | 可以内部 demo / 小范围试用 |
| 有效 | 产品是否真的交付核心价值，而不是通用 AI 包装？ | 可以招募 seed users |
| 优秀 | 产品是否产生 aha moment 和复访动力？ | 可以继续投入产品化和增长 |

同时，指标本身也分三层：

| 指标层级 | 衡量对象 | MVP 状态 |
|---|---|---|
| L1 Output validity | AI 输出是否可信、可用、不崩溃 | 已有 9.7 节，作为地基 |
| L2 Behavior change | 用户是否理解诊断并采取下一步行动 | MVP 核心验证层 |
| L3 Outcome | 真实面试结果是否改善 | 长周期跟踪，不作为 MVP 成功门槛 |

本文件的重点是补齐 L2。L1 只能证明系统没有明显失真，不能证明产品让用户变好；L3 最有说服力，但在 demo / seed user 阶段周期太长、噪音太大。

---

## 2. 北极星与核心假设

### 2.1 MVP 北极星指标

**Diagnostic Action Rate**

定义：

```text
完成反馈后产生诊断后行动的用户数 / 打开反馈页的用户数
```

一次“诊断后行动”至少满足以下任一条件：

- 用户点击并完成至少 1 次 Answer Polish。
- 用户保存至少 1 条 original 或 polished answer 到 Answer Bank。
- 用户在反馈页回答 “I know what to improve next” 为 yes / agree。
- 用户点击 Start new session。

辅助漏斗指标保留：

**Qualified Practice Completion Rate**

```text
完成一次有效练习的用户数 / 开始设置页的用户数
```

一次“有效练习”必须同时满足：

- 用户完成 Setup。
- 系统生成至少 3 道主问题。
- 用户至少回答 2 道主问题。
- 用户打开反馈页。
- 反馈页至少包含总体反馈和 2 道单题反馈。

MVP 初期不需要追求高规模转化。`Qualified Practice Completion Rate` 判断用户有没有走完整条路；`Diagnostic Action Rate` 判断诊断是否推动了用户的下一步行为。后者才更接近产品核心假设。

### 2.2 核心假设拆解

| 假设 | 用户证据 | 产品证据 |
|---|---|---|
| 个性化问题有价值 | 用户认为问题像真实岗位会问的问题 | 问题明确引用简历/JD/岗位要求 |
| 追问提高真实感 | 用户认为追问听懂了自己的回答 | 追问基于回答内容，而非机械模板 |
| 反馈产生 aha moment | 用户能指出“我之前没意识到的问题” | 反馈包含具体 evidence 和可执行下一步 |
| Polish 有复用价值 | 用户保存或复制 polished answer | Polish 保留事实，不编造指标或经历 |
| 产品值得继续用 | 用户愿意再练一轮或推荐给同类朋友 | 完成后触发新练习、保存答案、回访 |
| 诊断式反馈优于打分 | 用户知道下一步具体要改什么，并把建议转化成答案修改 | 反馈后清晰度、Mentor 建议采纳、同标签二次改善 |

---

## 3. MVP 行为改变指标

### 3.1 指标选择判断

6 月 demo / seed user 阶段，不应假设大多数 seed users 会完成第二次同题型面试。早期用户大概率先来验证一次核心体验，只有一部分会回访。因此：

- **主验证指标：C + B。**
- **A 必须埋点和建模，但不作为 MVP 成功门槛。**

| 候选指标 | 说服力 | MVP 成本 | 本期决策 |
|---|---:|---:|---|
| A. 同题型/同弱点标签二次面试改善率 | 高 | 高，需要二次面试和弱点标签 | 埋点，不设门槛 |
| B. Mentor 建议采纳率 | 中高 | 中，需要 Bank / Polish 对比 | 作为 MVP 主指标 |
| C. 下一步清晰度自评 | 中 | 低，反馈页一句话 | 作为 MVP 主指标 |

### 3.2 C：下一步清晰度

问题放在反馈页 Mentor block 后，避免打断阅读：

```text
Do you know exactly what to improve before your next interview?
[Yes] [Not yet]
```

记录事件：

```text
feedback_next_step_clarity_answered
```

字段：

| 字段 | 含义 |
|---|---|
| `session_id` | 当前 session |
| `answer` | yes / not_yet |
| `focus_type` | resume_deep_dive / behavioral / motivation_fit |
| `primary_weakness_tag` | ownership / impact / structure / language / motivation / role_fit / evidence / other |
| `feedback_status` | summary_ready / ready |

MVP 有效门槛：

- >= 70% feedback_opened 用户选择 yes。
- 选择 not_yet 的用户必须能继续看到更具体的单题 Next Version 或 Polish 入口。

这个指标不能证明真实能力提升，但能验证诊断式反馈是否至少把“下一步要改什么”说清楚。

### 3.3 B：Mentor 建议采纳率

定义：

```text
采纳 Mentor 建议的 saved/polished answers / 触发 Polish 或 Save 的 answers
```

采纳不是简单看文本长度变化，而是看保存版本是否吸收了 Mentor 的主要建议。

MVP 可用半自动判断：

| 采纳等级 | 判定 |
|---|---|
| none | 保存内容几乎等于原回答，且没有加入 Mentor 建议的关键信号 |
| partial | 加入了部分建议，例如 ownership 表达，但仍缺少 impact 或 evidence |
| strong | 明确吸收主要建议，回答结构、事实证据或表达策略发生可见变化 |

需要记录：

| 字段 | 含义 |
|---|---|
| `mentor_recommendation_id` | 当前单题 Mentor 建议 |
| `weakness_tags` | Mentor 标记的主要弱点 |
| `saved_source` | original / polish |
| `adoption_level` | none / partial / strong / unknown |
| `adoption_checked_by` | heuristic / manual / ai_judge |

MVP 有效门槛：

- 在触发 Polish 或 Save 的答案中，`partial + strong` >= 50%。
- `strong` >= 20%。

实现方式：

- Demo / 前 10 个 seed users：人工 review adoption_level。
- 后续：用轻量 AI judge 辅助判断，但保留人工抽查。

### 3.4 A：同弱点标签二次改善率

定义：

```text
用户第一次在某 weakness_tag 被标记 weak 后，
下一次同 focus_type 或同 weakness_tag 练习中，
该 tag 被标记为 improved 的比例
```

这是最能证明“诊断式反馈让人变好”的行为指标，但不适合作为 6 月 MVP 成功门槛。

本期只做三件事：

- 所有单题反馈写入 `weakness_tags`。
- 所有 Mentor 建议写入 `recommendation_id` 和 `target_weakness_tags`。
- 后续 session 的反馈能引用用户历史 weakness_tags，判断 `new / repeated / improved`。

MVP 后再设门槛：

- 7 天内完成第二次练习的用户中，>= 30% 至少 1 个历史 weakness_tag 从 weak 变为 improved。

---

## 4. 分级评估标准

### 4.1 合格：MVP 可交付门槛

合格标准关注“能不能交、会不会翻车”。

| 维度 | 合格标准 | 不合格信号 |
|---|---|---|
| 核心链路 | Landing → Auth → Setup → Call → Interview → Feedback 可完整跑通 | 任一 P0 页面阻断主流程 |
| 数据保存 | session、question_chains、feedback、bank save 写入稳定 | 刷新后关键数据丢失 |
| 问题生成 | 每场至少 3 道主问题；至少 2 道明显引用简历或 JD | 问题像通用题库 |
| 追问 | 至少 1 次追问基于用户回答内容 | 每次只问 “give more detail” |
| 反馈 | 每道反馈包含 Signal / Heard / Next Version | 只有评分或泛泛建议 |
| Polish | 生成一版完整答案；不添加用户未提供的事实 | 编造公司、数字、项目结果 |
| 可靠性 | AI 失败有重试或可恢复出口 | 用户卡死在 loading / error |
| Demo 安全 | 生产环境不得静默展示 demo fallback | 真实用户看到无关 demo 内容 |

定量门槛：

- AI 输出 schema validation 通过率 >= 90%。
- 创建面试 P95 可见等待 <= 8 秒。
- 追问判断 P95 <= 5 秒。
- 总体反馈 P95 可见时间 <= 12 秒。
- 完整单题反馈 P95 可见时间 <= 30 秒。
- Answer Polish P95 <= 12 秒。
- 端到端 demo 成功率 >= 95%（连续 20 次手工/脚本 demo 中最多失败 1 次）。

### 4.2 有效：核心价值成立门槛

有效标准关注“用户是否真的得到这个产品承诺的价值”。

| 维度 | 有效标准 | 采集方式 |
|---|---|---|
| 问题相关性 | >= 70% seed users 认为问题与自己的简历/JD “相关或非常相关” | 反馈页 micro-survey |
| 真实面试感 | >= 60% seed users 认为流程比直接问 ChatGPT 更像面试 | 访谈 + survey |
| 反馈具体性 | >= 70% seed users 能说出 1 条具体学到的改进点 | 访谈 |
| 下一步清晰度 | >= 70% feedback_opened 用户选择 “I know what to improve next” | 反馈页 micro-survey |
| Mentor 建议采纳 | >= 50% saved/polished answers 达到 partial 或 strong adoption | 人工 review / AI judge |
| 可行动性 | >= 60% seed users 愿意按建议重写至少 1 个回答 | Polish / save 行为 |
| 信任感 | 幻觉或事实错误被用户标记率 <= 10% session | thumbs down reason |
| 复用意愿 | >= 40% 完成反馈的用户保存至少 1 条答案 | 产品事件 |
| 再练意愿 | >= 30% 完成反馈的用户点击 Start new session | 产品事件，不强制要求完成第二次 |

产品有效不要求用户立刻每天使用；MVP 阶段更重要的是用户在第一次完整体验后说：

```text
This is about me. I know exactly what to fix next.
```

### 4.3 优秀：值得继续投入门槛

优秀标准关注“是否出现清晰的留存、推荐和差异化信号”。

| 维度 | 优秀标准 | 采集方式 |
|---|---|---|
| Aha moment | >= 50% seed users 主动提到“原来面试官会这样听” | 访谈记录 |
| 差异化 | >= 50% seed users 认为它比通用 AI 更适合面试准备 | 访谈 + survey |
| 答案资产化 | >= 50% 完成反馈用户保存或 polish 至少 1 条答案 | 产品事件 |
| 二次练习 | >= 25% seed users 在 7 天内完成第二次练习 | 产品事件 |
| 同弱点改善 | 二次练习用户中，>= 30% 至少 1 个历史 weakness_tag 改善 | 弱点标签追踪 |
| 推荐意愿 | >= 30% seed users 愿意介绍给同学/朋友 | 访谈 |
| 质量稳定 | eval set 平均人工评分 >= 4/5，且无 P0 幻觉失败 | eval review |
| 体验顺滑 | 用户无需指导即可完成核心链路 | 可用性测试 |

优秀不是“功能更多”，而是核心闭环更强：问题更像真实面试，反馈更像懂用户的人，Polish 更像用户可以真的说出口的版本。

---

## 5. 指标仪表盘

### 5.1 行为漏斗

| 事件 | 含义 |
|---|---|
| `landing_cta_clicked` | 用户点击主 CTA |
| `auth_completed` | 登录/注册完成 |
| `setup_started` | 进入设置页 |
| `setup_completed` | 完成设置并创建 session |
| `call_accepted` | 接听来电动画 |
| `question_answered` | 提交一道主问题或追问回答 |
| `session_completed` | 面试自然结束或用户主动结束 |
| `feedback_opened` | 打开反馈页 |
| `feedback_next_step_clarity_answered` | 回答是否知道下一步怎么改 |
| `polish_clicked` | 点击 Polish |
| `answer_saved_to_bank` | 保存原始或 polished answer |
| `mentor_recommendation_adopted` | 保存版本吸收 Mentor 建议 |
| `new_session_clicked` | 完成反馈后再次开始练习 |

关键漏斗：

```text
setup_started
→ setup_completed
→ call_accepted
→ question_answered >= 2
→ feedback_opened
→ feedback_next_step_clarity_answered
→ polish_clicked or answer_saved_to_bank
```

### 5.2 质量事件

| 事件 | 记录字段 |
|---|---|
| `ai_workflow_completed` | workflow, model, prompt_version, duration_ms, status |
| `ai_schema_validation_failed` | workflow, prompt_version, missing_fields, retry_count |
| `ai_fallback_used` | fallback_type, environment, workflow |
| `feedback_rated` | relevance_score, usefulness_score, trust_score |
| `feedback_issue_reported` | issue_type: hallucination / generic / too_harsh / not_actionable / wrong_level |
| `polish_rated` | fact_preserving, sounds_like_me, reusable |
| `weakness_tag_assigned` | weakness_tag, severity, evidence_ref |
| `weakness_tag_revisited` | previous_tag_id, current_status: repeated / improved / unresolved |

### 5.3 Seed User 访谈问题

每次完整体验后问 6 个问题即可：

1. 哪一道问题最像真实面试会问的？为什么？
2. 哪条反馈让你意识到自己之前没看到的问题？
3. 有没有任何内容让你觉得系统误解或编造了你？
4. 你会保存或复用哪一个 polished answer？
5. 你愿不愿意再用它练下一场面试？如果不愿意，卡点是什么？
6. 如果只看分数，不看这段诊断反馈，你会少知道什么？

---

## 6. Eval Set 要求

产品质量不能只靠真实用户反馈，MVP 必须保留固定 eval set。

最低要求：

- 10-15 个固定 cases。
- 覆盖 resume deep dive、behavioral、motivation fit。
- 覆盖强简历/弱 JD、弱简历/强 JD、无 JD、非母语英文、短回答、长但空泛回答、无关回答、Polish 信息不足等失败场景。
- 每个 case 人工评分 1-5，并记录失败标签。

人工评分标准：

| 分数 | 含义 |
|---|---|
| 1 | 不可用：通用、错误、幻觉或误导 |
| 2 | 勉强可读，但缺少个性化或行动价值 |
| 3 | 合格：能用，有证据，但亮点不强 |
| 4 | 有效：具体、可信、能指导用户下一步 |
| 5 | 优秀：高度贴合用户，产生 aha moment |

发布前门槛：

- 所有 P0 eval cases 不得出现事实编造。
- 平均分 >= 3.5 才可 seed user 测试。
- 平均分 >= 4.0 且无严重幻觉，才可扩大测试。

---

## 7. 发布决策

| 决策 | 条件 |
|---|---|
| 内部 demo | 达到“合格”全部阻断项；端到端 demo 稳定 |
| Seed user 招募 | 达到“合格”全部阻断项，且 eval set 平均 >= 3.5 |
| 扩大测试 | 达到“有效”核心指标，严重幻觉 <= 10% session，且 Diagnostic Action Rate 有稳定样本 |
| 产品继续投入 | 至少 2 个“优秀”信号成立：aha moment、二次练习、答案保存、推荐意愿 |

阻断项：

- 真实用户看到无关 demo fallback。
- Polish 编造事实或数字。
- Feedback 无 evidence 但给出强判断。
- 用户无法从错误状态恢复。
- RLS / auth 问题导致跨用户数据可见。

---

## 8. 与技术架构的边界

本文件定义产品是否“合格、有效、优秀”。

技术架构文档定义 AI workflow 如何做到可观测、可校验、可回滚，包括 schema validation、prompt version、trace、timeout、fallback 和 ledger。

两者关系：

- 产品指标判断价值是否成立。
- 技术指标判断系统是否稳定交付该价值。
- 发布决策必须同时看两者；任何一边失败都不能扩大测试。
