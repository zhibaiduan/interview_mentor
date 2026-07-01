# MVP PRD（体验新版）

**产品名（暂定）**：Interview Mentor  
**版本**：MVP v1.1  
**更新日期**：2026-05-11

---

## 1. 产品目标

### 1.1 背景

Non-native 科技求职者的问题通常不是“没有经历”，而是：

1. 不知道自己的经历应该如何对应目标岗位。
2. 面试表达不够自然、专业、有说服力。
3. 缺少低压力、可重复、接近真实面试节奏的练习环境。

### 1.2 MVP 要验证的问题

MVP 不是验证“能不能做一个大而全的 AI 面试平台”，而是验证：

**用户是否愿意上传自己的简历和岗位信息，进入一场定制化模拟面试，并在结束后获得足够有用的反馈。**

### 1.3 MVP 核心价值

1. 基于用户简历和目标岗位生成个性化模拟面试。
2. 用电话来电式沉浸体验降低练习门槛，并制造真实面试感。
3. 面试结束后以反馈页呈现招聘者视角、Coach 视角、单题改进和 Polish Answer。

---

## 2. 目标用户与使用场景

### 2.1 目标用户

0-5 年经验的 non-native 科技求职者，优先覆盖：

1. Software Engineer
2. Frontend Engineer
3. Backend Engineer
4. Product Manager
5. Data / Analyst 方向（可作为后续扩展）

### 2.2 核心场景

用户准备某个具体岗位的面试，希望快速完成一次低压力但足够真实的练习：

1. 上传或粘贴简历。
2. 选择目标岗位方向，或粘贴具体 JD。
3. 选择本轮练习重点。
4. 系统生成定制化问题库。
5. 用户接听模拟面试电话并完成对话。
6. 面试结束后打开反馈信封，查看详细反馈。

---

## 3. 产品范围

### 3.1 In Scope（MVP 必须做）

1. 首页入口
2. Start Session 配置流程
3. 简历上传 PDF 或粘贴文本
4. 面试方向设置
5. 练习重点设置
6. 定制化生成进度页
7. 沉浸式来电页面
8. 正式模拟面试对话
9. 面试结束动画与反馈信封
10. 反馈页

### 3.2 Out of Scope（MVP 暂不做）

1. 完整账户系统
2. 复杂 Dashboard 数据分析
3. 多轮历史记录管理
4. 大型公共题库
5. 视频面试分析
6. 实时面试外挂
7. 复杂题库编辑器
8. 完整付费系统

---

## 4. 核心用户流程

```text
Home
  -> Start Session
  -> Configure Resume / Target Role / Practice Focus
  -> Generate Personalized Interview
  -> Incoming Call
  -> Live Mock Interview
  -> Interview Ending
  -> Feedback Envelope
  -> Feedback Page
```

### 4.1 页面级流程

1. 用户进入首页。
2. 点击主要入口按钮：`Start Session` / `Start Practice`。
3. 进入模拟面试前配置页。
4. 用户填写个人信息和目标岗位信息。
5. 用户选择练习重点。
6. 点击 `Start Customized Mock Interview`。
7. 页面下方展示生成流程：
   - Reading your resume
   - Understanding your target role
   - Collecting interview context
   - Generating personalized question bank
   - Preparing your interviewer
8. 生成完成后自动跳转到沉浸式来电页。
9. 用户看到模拟面试官来电，可拒绝或接听。
10. 接听后进入正式模拟面试。
11. 面试结束后出现感谢动画和反馈信封。
12. 用户点击反馈信封，进入反馈页。

---

## 5. 页面与功能需求

## 5.1 首页（Home）

### 目标

首页不需要承担复杂信息展示。MVP 阶段首页的目标是让用户快速理解产品价值，并进入一次练习。

### 必须包含

1. 产品名：Interview Mentor
2. 一句话价值主张
3. 主入口按钮：`Start Session` / `Start Practice`
4. 简短说明：本轮会基于简历、目标岗位和练习重点生成模拟面试

### 可选内容

1. 最近一次练习入口
2. Question Bank 入口
3. Resume / Materials 入口
4. Progress 入口

MVP 可以先只做主入口，把其他入口作为视觉占位或后续模块。

---

## 5.2 Start Session 配置页

### 目标

配置页负责收集足够的信息，让用户相信后面的模拟面试是“为我定制的”，不是通用题库。

### 配置项 1：个人信息 / 简历

用户可以二选一：

1. 上传 PDF 简历
2. 粘贴简历文本

MVP 允许先支持文本粘贴，PDF 上传作为 UI 入口和后续能力；如果技术时间允许，再实现 PDF 文本解析。

### 配置项 2：面试方向

用户可以二选一：

1. 自定义岗位
2. 选择通用岗位模板

#### 自定义岗位

用户填写或粘贴：

1. 公司名（可选）
2. 岗位名称
3. Job Description / 岗位信息

#### 通用岗位模板

MVP 推荐提供：

1. Product Manager
2. Software Engineer
3. Frontend Engineer
4. Backend Engineer

当用户选择通用岗位时，页面下方展示该岗位的通用面试模板说明，例如：

1. 常见考察能力
2. 本轮可能覆盖的问题类型
3. 默认面试官角色

### 配置项 3：练习重点

MVP 先提供三个选项：

1. Resume / Career Experience
2. Case Study
3. Behavioral Practice

用户可以单选。后续版本可以支持多选。

### 主按钮

按钮文案建议：

`Start Customized Mock Interview`

点击后不立即进入面试，而是进入生成进度状态。

---

## 5.3 定制生成进度（Customization Progress）

### 目标

让用户感知系统正在根据自己的材料准备面试，而不是机械跳转。

### 展示内容

点击开始按钮后，在页面下方或独立过渡页展示进度步骤：

1. Reading your resume
2. Extracting your experience highlights
3. Understanding your target role
4. Collecting interview expectations
5. Generating personalized question bank
6. Preparing your interviewer

### 行为

1. 每个步骤依次进入 loading / completed 状态。
2. 全部完成后自动跳转到 Incoming Call 页面。
3. 如果生成失败，提供重试按钮。

### MVP 简化

MVP 可以先使用模拟进度动画，但生成出的面试问题需要与用户输入相关。

---

## 5.4 沉浸式来电页面（Incoming Call）

### 目标

用“电话来电”降低用户开始练习的心理阻力，同时增强真实面试氛围。

### 页面内容

1. 模拟面试官头像或真人感视觉
2. 面试官姓名
3. 面试官身份，例如：
   - Hiring Manager at XX Company
   - HR Manager at XX Company
   - Engineering Manager
   - Product Lead
4. 来电状态
5. 两个动作：
   - Decline
   - Accept

### 面试官信息生成

根据用户选择生成：

1. 如果用户填写具体公司和岗位，面试官身份应与该公司/岗位相关。
2. 如果用户选择通用岗位模板，使用通用身份，例如 `Engineering Manager` 或 `Product Hiring Manager`。

---

## 5.5 正式模拟面试（Live Mock Interview）

### 目标

提供一段接近真实电话面试的练习体验。

### 核心交互

1. 用户接听后，面试官先说开场白。
2. 系统提出第一题。
3. 用户通过语音作答。
4. 系统转写用户回答。
5. 系统根据回答追问或进入下一题。
6. 面试结束后进入结束动画。

### 面试结构

MVP 默认一轮 5 个核心问题，但具体问题应根据配置变化：

#### Resume / Career Experience

重点覆盖：

1. 自我介绍
2. 最相关项目
3. 职责和影响
4. 失败或挑战
5. 岗位匹配

#### Case Study

重点覆盖：

1. 问题澄清
2. 结构化分析
3. 用户/业务目标
4. 方案取舍
5. 总结表达

#### Behavioral Practice

重点覆盖：

1. 团队合作
2. 冲突处理
3. 压力情境
4. 失败复盘
5. 领导力或 ownership

### 时长

MVP 暂不强制固定时长。建议先采用：

1. 固定最多 5 轮问答
2. 页面显示计时器
3. 后续版本再支持 10 / 15 / 30 分钟模式

### 结束方式

1. 系统完成本轮问题后自动结束。
2. 用户可以手动结束。
3. 结束后不要立刻跳反馈页，而是先展示结束动画和反馈信封。

---

## 5.6 面试结束动画与反馈信封

### 目标

把“完成练习”做成一个明确的心理节点，让用户愿意打开反馈。

### 内容

面试结束后，页面以动画方式展示：

1. 感谢语，例如：
   - Thank you for completing this interview.
   - Every practice round makes your next answer clearer.
2. 一个反馈信封 / 礼物式反馈入口
3. CTA：`Open Feedback`

### 行为

用户点击反馈信封后，进入 Feedback Page。

---

## 5.7 反馈页（Feedback Page）

### 目标

反馈页要回答用户最关心的问题：

1. 我这轮表现怎么样？
2. 面试官听到了什么信号？
3. 我最应该改哪里？
4. 下一版答案应该怎么说？

### 必须包含

1. Round Summary
2. Recruiter Lens
3. Coach Lens
4. Scoreboard
5. Question Review
6. Polish Answer
7. Next Action

### Question Review 每题包含

1. 原题
2. 用户回答转写
3. 题目考察意图
4. 招聘者视角反馈
5. Coach 改进建议
6. Polish Answer

### 后续 CTA

1. Start another round
2. Save to Question Bank
3. Re-practice weakest answer

MVP 可以先展示 Save to Question Bank 的按钮，但不一定实现完整题库管理。

---

## 6. 核心数据对象

MVP 推荐围绕 `PracticeSession` 组织数据，而不是把每个页面做成孤立页面。

```js
PracticeSession = {
  id,
  resumeText,
  resumeFileName,
  targetMode, // custom | template
  targetRole,
  companyName,
  jobDescription,
  practiceFocus, // resume | case | behavioral
  interviewer: {
    name,
    title,
    company
  },
  generatedQuestions: [],
  turns: [
    {
      question,
      transcript,
      followUp,
      nextAction,
      recruiterLens,
      coachTip,
      polish
    }
  ],
  summary: {
    overall,
    strengths,
    risks,
    nextAction
  }
}
```

---

## 7. 非功能需求

1. 页面节奏要低压力，避免像考试系统。
2. 来电和面试页面要有沉浸感，但不能牺牲清晰操作。
3. 生成进度要让用户感到“正在定制”，但等待时间不能太长。
4. 语音转写失败时必须允许继续，不应卡死。
5. 没有 OpenAI API key 的 demo 环境也应该能跑通主流程。
6. 反馈必须具体、可执行，避免空泛夸奖。
7. 页面之间的状态必须能通过 session 数据串起来。

---

## 8. 成功指标

### 8.1 行为指标

1. Start Session 点击率
2. 配置页完成率
3. 定制生成完成率
4. Accept Call 点击率
5. 面试完成率
6. Open Feedback 点击率
7. 反馈页停留时间

### 8.2 价值指标

1. 用户是否觉得问题与自己相关
2. 用户是否觉得面试体验真实
3. 用户是否觉得反馈具体有用
4. 用户是否愿意再练一轮
5. 用户是否愿意保存或复用 Polish Answer

---

## 9. Demo 开发优先级

### P0（必须完成）

1. Home 入口
2. Start Session 配置
3. 简历文本粘贴
4. 岗位自定义 / 通用模板选择
5. 练习重点选择
6. 定制生成进度动画
7. Incoming Call 页面
8. Live Mock Interview
9. 结束动画 + 反馈信封
10. Feedback Page

### P1（应该完成）

1. PDF 简历上传和文本解析
2. 生成更个性化的面试官姓名和身份
3. 根据练习重点生成不同问题结构
4. 反馈页读取真实 session turns
5. Re-practice weakest answer

### P2（可延后）

1. Question Bank 完整保存和管理
2. 多次练习历史
3. Progress 页面
4. 用户账户
5. 付费页

---

## 10. 风险与对策

### 风险 1：流程太长，用户还没面试就流失

对策：

1. 首页入口保持非常明确。
2. 配置项控制在 3 组以内。
3. 生成进度不超过 10-15 秒。

### 风险 2：来电效果有仪式感，但不够实用

对策：

1. 来电页只作为短过渡，不堆太多视觉元素。
2. Accept 后立刻进入第一题。
3. 用户随时可以退出。

### 风险 3：反馈页像模板，不像来自真实面试

对策：

1. 每题反馈必须引用用户回答中的具体内容。
2. Polish Answer 必须保留用户真实经历。
3. 招聘者视角和 Coach 视角要分工明确。

### 风险 4：开发范围膨胀

对策：

1. MVP 暂不做完整账户和题库。
2. PDF 上传可以先做入口，解析作为 P1。
3. 首页先做主入口，不做复杂 Dashboard。

---

## 11. MVP 一句话

**Interview Mentor 的 MVP 是一次从“上传材料”到“接听模拟面试电话”再到“打开反馈信封”的完整定制化练习体验。**

它不追求功能大而全，而是让用户在一次练习后明确感到：

**这场面试是为我准备的，反馈能让我下一次答得更好。**
