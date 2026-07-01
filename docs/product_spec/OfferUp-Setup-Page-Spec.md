# OfferUp — 面试前设置页完整规格

**文档性质** PRD 附录，聚焦「设置页」模块  
**更新时间** 2026-06-19（v1.6：锁定 Setup 独立页 + 轻量资产 drawer）  
**关联文档** 主 PRD · Agent 设计规格

---

## 1. 设置页整体结构

设置页是独立页面，而不是 Dashboard 内弹窗。原因是 Setup 承载简历、目标岗位、模式、题型、追问强度和确认栏，属于核心流程，不应该被压缩进 modal。

但已保存简历和 JD history 不做沉重的独立管理页作为 MVP 入口。它们在 Setup 内通过轻量 picker drawer / modal 调用，选择后直接填入当前表单，避免用户离开配置流程。

设置页分为三个顺序步骤，Step 1 和 Step 2 所有模式共用，Step 3 根据选择的模式展开不同字段。

```
Step 1 · 简历信息         ← 所有模式必填
Step 2 · 训练模式选择      ← 决定后续字段
Step 3 · 模式专属设置      ← Mode 1 展开详细字段 / Mode 2 灰色占位
─────────────────────────
预览确认栏               ← 汇总显示，用户确认后进入面试
```

---

## 2. Step 1：简历信息

### 2.1 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 简历文本 | textarea | ✅ 必填 | 粘贴简历内容，支持中英文混贴 |
| 从已保存简历调用 | picker drawer / modal | ✅ P0（有保存简历时显示） | 在当前 Setup 页面内选择已保存简历并自动填入 |

### 2.2 输入规则

**字数限制：**
- 最少 100 字（低于此值提示「简历内容太少，建议补充项目经历」）
- 建议范围 200–3000 字
- 最多 5000 字（超出截断并提示）

**内容建议提示（非强制）：**
用户输入完成后，显示简单的内容检测提示，帮助用户判断简历质量：
```
✅ 检测到项目经历（AI 可基于此提问）
✅ 检测到工作经历
⚠️  未检测到具体数字或结果（建议补充以获得更精准的问题）
```

**数据用途说明（UI 上明确展示）：**
> 简历内容仅用于生成个性化面试问题，不会与第三方分享。

### 2.3 交互行为

- 用户可以手动粘贴，也可以从个人主页已保存简历中一键调用
- 如果用户已登录且有保存的简历，默认展示「调用已保存简历」的快捷入口
- 点击「调用已保存简历」打开当前页内 picker drawer / modal，不跳离 Setup
- 从 Dashboard 的 My resumes 入口进入时，可打开 `/setup?panel=resumes` 并自动展示该 picker
- 简历内容在本次会话期间缓存，不强制要求每次重新输入

---

## 3. Step 2：训练模式选择

### 3.1 两个模式卡片

**Mode 1 · 专项练习（可选）**
- 副标题：「针对特定题型的短时高强度练习」
- 预估时长：8–12 分钟
- 题目量：默认固定 3 题主问题（每题根据回答质量触发 0–5 次追问）
- 状态：可选，点击后展开 Step 3 Mode 1 设置字段

**Mode 2 · 全流程模拟（不可选）**
- 副标题：「模拟完整多轮面试流程」
- 状态：灰色禁用，显示「即将开放」标签
- 点击后弹出 tooltip：「全流程模拟功能正在开发中，敬请期待」
- 不展开任何字段，不可进入面试

### 3.2 默认选中

页面加载时默认选中 Mode 1，不需要用户主动点击再展开。

---

## 4. Step 3：Mode 1 专属设置字段

### 4.1 字段总览

| 字段 | 类型 | 必填 | 默认值 | 影响什么 |
|------|------|------|--------|---------|
| 目标岗位 | 文本输入 or JD 粘贴 | ✅ 必填 | 无 | 问题个性化 + 面试官身份 + 评估标准 |
| 经验级别 | 单选（3档） | ✅ 必填 | **Junior** | 问题深度 + 评估标准 |
| 题型模块 | 单选（5个） | ✅ 必填一个 | **Resume Deep Dive** | 决定面试官 Agent 身份 + 问题方向 |
| 面试语言 | 单选（2个） | ✅ 必填 | **English** | 问题生成语言 + 反馈语言 |
| 追问强度 | 三档单选 | ✅ 必填 | **中（0–3次）** | 控制追问上限，AI 自行判断是否追问 |

> **设计原则：** 用户进入设置页时，除简历和目标岗位外，所有字段均预填默认值。用户只需完成这两个必填项即可点击「开始面试」，减少启动阻力。

---

### 4.2 字段 A：目标岗位

**两种输入方式，用户二选一：**

**方式一：通用角色（快速选择）**
- 提供常见角色的快速标签（点选即填）：
  - 产品经理（PM）
  - 前端工程师
  - 后端工程师
  - 数据分析师
  - UX 设计师
  - 运营
  - 其他（手动输入）
- AI 用该角色生成通用但仍合理的问题

**方式二：粘贴具体 JD（推荐，效果更好）**
- textarea，粘贴 LinkedIn / Stepstone 等 JD 原文
- 如果用户有历史 JD，显示「Use previous JD」入口，打开当前页内 picker drawer / modal
- 字数上限：3000 字
- 如果用户填了 JD，还需要额外填写：
  - 公司名称（单行文本，选填，用于来电动画和面试官自我介绍）
- UI 上明确标注「粘贴 JD 可获得更精准的个性化问题」

**字段验证：**
- 通用角色：至少选择或输入一个角色名称
- JD 粘贴：至少 50 字才视为有效输入
- 两种方式至少完成其中一种，否则无法进入下一步
- 从 Dashboard 的 JD history 入口进入时，可打开 `/setup?panel=jd-history` 并自动展示 JD picker

**传入 AI 的处理逻辑：**
```
if (jd_text) {
  → 解析 JD 为结构化字段：{ job_title, company_name, key_requirements[], nice_to_have[] }
  → 用于问题生成和评估标准校准
} else {
  → 用通用角色名称生成标准化问题
  → 评估标准使用该角色的通用 benchmark
}
```

---

### 4.3 字段 B：经验级别

**三档单选：**

| 选项 | 面向人群 | 对 AI 的影响 |
|------|---------|------------|
| Junior（0–2年） | 应届 / 初级 | 问题聚焦基础理解、学习能力、项目参与；评估标准相对宽松 |
| Mid-level（2–5年） | 有一定经验 | 问题聚焦独立决策、项目主导、技术/业务判断 |
| Senior（5年以上） | 资深候选人 | 问题聚焦战略思考、团队影响、系统设计、跨部门协作 |

**UI 展示方式：** 三个卡片式单选，每个卡片包含档位名称 + 一句话描述 + 典型问题举例

**传入 prompt 的方式：**
```
候选人目标级别：{level}
请根据该级别调整问题深度和评估标准。Junior 候选人不要求有 5 年经验才能回答的深度，Senior 候选人的回答需要展示领导力和系统性思考。
```

---

### 4.4 字段 C：题型模块

**四个题型，单选：**

| 题型 | 英文标签 | 映射 Agent | 典型问题举例 |
|------|---------|----------|------------|
| 简历深挖 | Resume Deep Dive | Hiring Manager Agent | Walk me through the [项目名] project — what was your specific role? |
| 行为测试 | Behavioral (STAR) | HR Agent | Tell me about a time you had to align stakeholders with conflicting priorities. |
| 动机与背景 | Motivation & Fit | HR Agent | Why this company, this role, and why Germany / Europe? |
| 文化与协作 | Culture & Collaboration | 综合 Agent（HR + HM） | Tell me about a time your team disagreed — how did you reach a decision? |
| 情景判断 | Situational / Case | Hiring Manager Agent | If users report feature X is broken but engineering bandwidth is limited, what do you do? |

> **MVP 实现：Resume Deep Dive、Behavioral、Motivation & Fit 三个可选；Culture & Collaboration 和 Situational / Case 灰色占位「即将开放」。**  
> Resume Deep Dive + Behavioral 覆盖核心验证场景，Motivation & Fit 是非母语用户在欧洲求职的高频痛点，三个足以验证核心假设。

**UI 展示方式：** 五个选项卡（MVP 前 4 个可选，第 5 个灰色占位），每个包含：
- 题型名称（中文 + 英文）
- 一句话描述
- 面试官身份标注
- 一个示例问题

| 选项卡 | 面试官标注 | MVP 状态 |
|--------|----------|---------|
| 简历深挖 Resume Deep Dive | Hiring Manager 视角 | ✅ 可选（默认选中） |
| 行为测试 Behavioral (STAR) | HR 视角 | ✅ 可选 |
| 动机与背景 Motivation & Fit | HR 视角 | ✅ 可选 |
| 文化与协作 Culture & Collaboration | HR + Hiring Manager 综合视角 | 🔒 即将开放 |
| 情景判断 Situational / Case | Hiring Manager 视角 | 🔒 即将开放 |

**选择后自动显示：**
```
✓ 已选：简历深挖
  面试官：Hiring Manager 视角
  预计问题：基于你简历中的具体项目经历，考察实际 ownership 和 impact
```

---

### 4.5 字段 D：面试语言

**MVP 阶段只开放 English，Deutsch 灰色不可选：**

| 选项 | 状态 | 说明 |
|------|------|------|
| English | ✅ 默认选中，可用 | 问题、追问、反馈全程英文；语言评估针对英语专业表达 |
| Deutsch | 🔒 灰色禁用 | 即将开放 — 点击显示 tooltip「德语面试功能即将上线」 |

**默认行为：** 页面加载时 English 自动选中，用户无需主动操作。

**UI 展示方式：**
- English 卡片：正常高亮选中状态
- Deutsch 卡片：`opacity: 0.5`，右上角显示「即将开放」标签，不可点选触发

**重要说明（UI 上展示）：**
> 用户可以用任何语言回答，面试官将用英文提问和反馈。

**传入 prompt 的方式：**
```
面试语言：English（固定）
所有问题、追问和反馈必须使用英文。
如果候选人用中文或其他语言回答，正常评估内容逻辑，
并在 Mentor 反馈中额外指出语言切换对面试官感知的影响。
```

---

### 4.6 字段 E：追问强度（问题链模式）

**默认状态：** 中（推荐）

**三档强度选择：**

| 档位 | 追问上限 | 适用场景 | 预计总时长 |
|------|---------|---------|----------|
| 低 | 0–1 次 / 题 | 快速热身、时间有限 | 约 8–10 分钟 |
| 中（推荐） | 0–3 次 / 题 | 标准练习、接近真实面试节奏 | 约 12–18 分钟 |
| 高 | 0–5 次 / 题 | 深度训练、模拟高强度技术面 | 约 20–30 分钟 |

**「上限」的含义：** 数字是 AI 可追问的最大次数，不是固定次数。AI 自行判断每题是否值得追问及追问几次——回答完整则不追问，回答有明显深挖空间才追问，直到达到该档上限为止。

**UI 展示方式：**
```
追问强度
[ 低  0-1次 ]  [ ● 中  0-3次 ]  [ 高  0-5次 ]
AI 会根据你的回答质量自动决定是否追问，不会强制追问到上限。
预计时长：约 12–18 分钟
```

选择不同档位时，预览确认栏中的「预计时长」动态更新。

**关闭追问（兜底选项）：**
- 在低档旁额外提供「关闭」选项（`off`），点击后 0 追问，纯主题问答
- 3 题结束直接进入反馈

**传入 prompt 的方式：**
```
追问强度：{intensity}（low | medium | high | off）
追问上限：{max_follow_ups}（1 | 3 | 5 | 0）

对于每道主问题，你需要先判断是否值得追问：
- 如果回答已经完整（有背景、行动、结果、量化数据），不必追问
- 如果回答有明显值得深挖的点，可以追问，但不得超过上限次数
- 追问必须基于候选人的具体回答内容，不得重复主问题或提问无关内容
```

---

## 5. 问题链（Question Chain）设计规格

这是本产品的核心交互特性，需要在设置页、面试会话、Agent 评估三个层面都体现。

### 5.1 什么是问题链

```
主问题（Q_main）
  └─ 用户回答（A1）
       └─ 追问 1（Q_follow_1）    ← AI 基于 A1 生成
            └─ 用户回答（A2）
                 └─ 追问 2（Q_follow_2）    ← AI 基于 A1 + A2 生成（可选）
                      └─ 用户回答（A3）
```

一道主问题 + 其所有追问和回答，构成一条「问题链」。

### 5.2 追问生成逻辑

AI 自主判断每题是否追问及追问几次，上限由用户选择的强度档位控制。

**触发追问的条件（AI 判断依据）：**

| 触发条件 | 追问方向举例 |
|---------|------------|
| 回答笼统，缺少具体细节 | "Can you walk me through exactly what you did?" |
| 提到了值得深挖的决策或方案 | "You mentioned choosing X over Y — what drove that decision?" |
| 缺少结果或量化数据 | "What was the outcome of that initiative?" |
| 展示了有趣视角值得探讨 | "Was that approach widely accepted by the team at the time?" |
| 回答前后逻辑不一致 | "Earlier you mentioned X, but just now you said Y — can you clarify?" |

**不触发追问的条件：**
- 回答已完整（背景 + 行动 + 结果均有，且有具体细节）
- 当前问题链已达到强度上限（low: 1 / medium: 3 / high: 5）
- 用户明确表示「没有更多可以补充」

**强度上限的实际含义：**
高强度不等于每题都追问 5 次——AI 对一个已经回答得非常好的问题不会强行追问。上限是「天花板」，而非「目标值」。

### 5.3 问题链的 Agent 评估规则

**核心原则：评估基于整条链路，而非单个回答。**

传入 Agent 的数据结构：
```json
{
  "question_chain": {
    "main_question": "Walk me through the X project.",
    "exchanges": [
      {
        "role": "interviewer",
        "content": "Walk me through the X project."
      },
      {
        "role": "candidate",
        "content": "用户回答 1"
      },
      {
        "role": "interviewer",
        "content": "追问：You mentioned Y, why did you choose that approach?"
      },
      {
        "role": "candidate",
        "content": "用户回答 2"
      }
    ]
  }
}
```

**Agent 评估时的关键指令：**
```
请将整条问题链作为一个整体进行评估，不要割裂每条回答单独打分。
评估候选人在这条链路中的整体表现：
- 初始回答是否有结构？
- 追问后是否能提供更深的细节？
- 在压力追问下是否保持一致性和专业度？
- 整条链路下来，你对候选人的总体印象是什么？
```

---

## 6. 预览确认栏

用户完成所有必填字段后，在设置页底部展示「开始前预览」：

```
┌─────────────────────────────────────────────┐
│  本次练习预览                                  │
│                                              │
│  训练模式      专项练习 · 简历深挖              │
│  面试官        Hiring Manager 视角             │
│  目标岗位      产品经理（Werkstudent）           │
│  经验级别      Junior                          │
│  面试语言      English                         │
│  追问强度      中（每题最多 3 次追问）            │
│  预计时长      约 10–15 分钟                    │
│  主题数量      3 道主题                         │
│                                              │
│  [  开始面试  ]                               │
└─────────────────────────────────────────────┘
```

**「开始面试」按钮触发条件：**
- Step 1 简历已填写（≥100 字）
- Step 3 所有必填字段已完成（目标岗位 + 经验级别 + 题型 + 语言）
- 未满足时按钮灰色禁用，鼠标悬停显示「请先完成上方必填项」

---

## 7. 设置数据传入 AI 的完整结构

用户完成设置并点击「开始面试」后，前端组装以下数据传给后端：

```json
{
  "session_config": {
    "mode": "focused",
    "resume_text": "用户简历全文",
    "target_role": {
      "type": "jd | generic_role",
      "generic_role_name": "产品经理",
      "jd_text": "原始JD文本（如有）",
      "company_name": "Personio（如有）",
      "parsed_requirements": []
    },
    "focus_type": "resume_deep_dive | behavioral | motivation_fit | culture_collaboration | situational",
    "level": "junior | mid | senior",
    "interview_language": "en",
    "follow_up_intensity": "low | medium | high | off",
    "max_follow_ups_per_question": 3,
    "main_question_count": 3
  }
}
```

后端收到后，按以下顺序调用 AI：

```
1. 解析 JD + 简历（如有JD）→ 生成 candidate_job_fit_map
2. 确定面试官 Agent 身份（基于 focus_type 映射）
3. 生成 3 道主问题（基于 fit_map + level + focus_type + language）
4. 开始面试会话（问题逐题推送）
```

---

## 8. Mode 2 设置页占位规格（UI 层，不实现逻辑）

### 8.1 UI 展示要求

Mode 2 卡片在 Step 2 中展示，视觉状态：
- 整体透明度 60%（`opacity: 0.6`）
- 右上角标签：「即将开放」（amber 色标签）
- 卡片内容可见但不可交互

### 8.2 点击行为

点击 Mode 2 卡片时：
- 不展开任何设置字段
- 显示一个轻量 tooltip 或 inline 提示：
  > 「全流程模拟正在开发中，即将上线。目前可先通过专项练习热身。」
- 不报错，不跳转

### 8.3 Mode 2 V2 规划（文档存档，不实现）

以下是 Mode 2 的设置字段规划，供 V2 开发参考：

| 字段 | 类型 | 说明 |
|------|------|------|
| 简历 | textarea | 同 Mode 1 |
| 目标公司 + JD | 必填 | Mode 2 必须有具体 JD 才有意义 |
| 面试轮次数 | 选择 1–4 轮 | 每轮对应不同 Agent 身份 |
| 每轮时长 | 选择 10/15/20 分钟 | 控制每轮问题数量 |
| 面试语言 | 同 Mode 1 | |
| 公司调研开关 | toggle | 开启后 AI 会搜索公司公开信息并融入问题 |
| 面试轮次配置 | 可自定义每轮类型 | Round 1 = HR / Round 2 = Technical / ... |

---

## 9. 验收标准（设置页）

### P0 必须通过

- [ ] 简历字数低于 100 字时，「开始面试」按钮禁用，且显示提示文案
- [ ] 目标岗位未填写时，无法开始
- [ ] 页面加载时，经验级别默认 Junior、题型默认 Resume Deep Dive、追问强度默认中，无需用户操作
- [ ] 面试语言默认 English 已选中，Deutsch 灰色不可点选
- [ ] 点击 Deutsch → 显示「即将开放」tooltip，不报错
- [ ] Culture & Collaboration 和 Situational 灰色占位，点击显示「即将开放」
- [ ] 点击 Mode 2 → 显示「即将开放」提示，不报错
- [ ] 仅简历和目标岗位为空时，「开始面试」按钮禁用
- [ ] 预览确认栏正确显示所有字段（含默认值）
- [ ] 从个人主页调用已保存简历的快捷入口正常工作
- [ ] 点击「开始面试」后，配置数据正确传入后端

### P1 期望通过

- [ ] 简历内容检测提示正常显示（有/无项目经历的不同提示）
- [ ] 设置页在移动端可正常使用（字段不溢出）

---

*本文档配合《OfferUp MVP PRD》和《Multi-Agent 反馈系统设计规格》使用。*
