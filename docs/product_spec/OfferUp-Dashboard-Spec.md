# OfferUp — Dashboard 完整功能规格

**文档性质** 功能规格文档，指导前端开发  
**版本** v1.1  
**更新时间** 2026-06-18  
**关联文档** 主 PRD Section 3.7 · 技术架构文档 · 反馈模块规格

---

## 1. 设计目标

两件事，缺一不可：

1. **最快进入操作** — 用户进来立刻知道下一步做什么，一次点击开始练习
2. **感受到进步** — 不是评分，是参与日历的色块密度和练习积累传达的习惯感

**不做的事：** 不展示评分数字，不做趋势折线图，不做维度雷达图。产品的核心理念是「诊断比评分重要」，Dashboard 与之一致。

优先级说明：登录后完整 Home/Dashboard 是 P0。P0 包含欢迎区、Mode 入口、参与日历、最近练习记录、资产概览、已保存简历入口、JD 历史入口、Answer Bank / Question Library 入口和账号退出。P1 只保留更细的筛选、点击过滤和分析增强。

---

## 2. 页面结构总览

```
Dashboard
├── 区域 1：欢迎 + 两个 Mode 入口
├── 区域 2+3：参与日历 + 练习记录（合并）
└── 区域 4：资产概览
```

侧边栏（固定）：
```
侧边栏
├── Logo / 产品名
├── Home（当前页，高亮）
├── Answer bank
├── History
├── Question library
└── 底部用户头像 + 下拉菜单
```

---

## 3. 页面状态分类

Dashboard 根据用户的历史数据量，有三种完全不同的展示状态：

| 状态 | 条件 | 说明 |
|------|------|------|
| **零状态** | `completed_sessions = 0` | 首次使用，没有任何练习记录 |
| **早期状态** | `1 ≤ completed_sessions ≤ 2` | 有少量记录，部分模块数据不足 |
| **正常状态** | `completed_sessions ≥ 3` | 全部模块正常展示 |

---

## 4. 区域 1：欢迎 + Mode 入口

### 4.1 零状态

```
Welcome, [display_name].
Let's get started.

┌────────────────────────┐  ┌────────────────────────┐
│  Focused drill          │  │  Full simulation        │
│                         │  │                         │
│  Targeted practice      │  │  Complete mock          │
│  Resume deep dive,      │  │  interview              │
│  behavioral, or         │  │                         │
│  motivation questions.  │  │  Multi-round, adaptive. │
│  ~15 min.               │  │  Based on your JD.      │
│                         │  │  ~45 min.               │
│  [Start your first      │  │                         │
│   session →]            │  │  [Coming soon]          │
└────────────────────────┘  └────────────────────────┘
```

- 标题用 Serif 字体，「Let's get started.」italic
- Mode 1 卡片：1.5px 实边框，正常 opacity，`Start your first session →` 按钮
- Mode 2 卡片：0.5px 边框，`opacity: 0.55`，`Coming soon` 灰色标签

### 4.2 早期状态 / 正常状态

```
Good to see you, [display_name].

[N] sessions in.         ← Serif，大字
Keep going.              ← Serif，italic，次色

┌────────────────────────┐  ┌────────────────────────┐
│  Focused drill          │  │  Full simulation        │
│  Targeted practice      │  │  ...                    │
│  [Start →]              │  │  [Coming soon]          │
└────────────────────────┘  └────────────────────────┘
```

- `[N]` = `count(interview_sessions WHERE status='completed')`
- Mode 1 的按钮文字从「Start your first session」改为「Start →」

### 4.3 字段定义

| 字段 | 数据来源 | 空值处理 |
|------|---------|---------|
| `display_name` | profiles.display_name | fallback 到 email 前缀 |
| `completed_count` | count(interview_sessions WHERE status='completed' AND user_id=current) | 0 时触发零状态 |

### 4.4 Mode 卡片交互

**Mode 1（Targeted Practice）：**
- 点击 `Start →` → `router.push('/setup?mode=focused')`
- 整张卡片不可点击，只有按钮响应（避免误触）

**Mode 2（Complete Mock Interview）：**
- 整张卡片 `pointer-events: none`，不可交互
- 外层 wrapper 响应 click，显示 tooltip：「Full simulation is coming soon」
- 不跳转，不报错

---

## 5. 区域 2+3：参与日历 + 练习记录

### 5.1 参与日历

**渲染规则：**
- 显示过去 84 天（12 周 × 7 天）
- 从左到右时间从旧到新，今天是最右侧
- 按行排列，每行 7 个色块（周一到周日）
- 上方显示月份标签（当月份发生变化时）

**色块状态（只有两种）：**

| 状态 | 条件 | 样式 |
|------|------|------|
| 有练习 | 当天有 ≥1 条 completed session | `background: var(--color-text-primary)` |
| 无练习 | 当天没有 completed session | `background: var(--color-background-tertiary); border: 0.5px solid var(--color-border-tertiary)` |

**Hover 行为：**
- 所有色块 hover 显示 tooltip：日期（如 `Jun 8`）
- 有练习的色块 tooltip 追加：`· 1 session`（如有多次：`· 2 sessions`）

**点击行为（P1 增强）：**
- 有练习的色块：点击 → 下方练习记录过滤到当天，色块出现选中样式（加边框）
- 无练习的色块：点击无效果
- 再次点击已选中的色块 → 取消过滤，恢复显示最近5条

**零状态：**
- 日历正常渲染，全部色块为「无练习」状态
- 不显示「你还没有练习记录」的提示，让空白日历自己说话

**数据查询：**
```sql
SELECT DATE(created_at) as practice_date, COUNT(*) as session_count
FROM interview_sessions
WHERE user_id = current_user_id
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '84 days'
GROUP BY DATE(created_at)
```

### 5.2 练习记录列表

**标题行：**
```
Practice activity                    View all →
```
- `View all →` → 跳转 `/history`（完整历史记录页）

**默认展示：** 最近 5 条 completed sessions，按 `completed_at` 倒序

**点击日历过滤后（P1 增强）：** 只展示当天的 sessions，无数量限制

**每条记录显示：**
```
[岗位名 · 公司名（如有）]        [状态标签]  ›
[题型标签] · [日期]
```

**字段来源：**

| 字段 | 来源 |
|------|------|
| 岗位名 | `interview_sessions.jd_history.job_title` 或 `generic_role` |
| 公司名 | `jd_history.company_name`（nullable，有则显示「· 公司名」） |
| 题型 | `interview_sessions.focus_type` → 映射为显示标签 |
| 日期 | `interview_sessions.completed_at`，格式：`May 17` |
| 状态标签 | 见 5.3 |

**focus_type 显示映射：**

| focus_type | 显示文字 |
|-----------|---------|
| resume_deep_dive | Resume deep dive |
| behavioral | Behavioral |
| motivation_fit | Motivation & fit |
| culture_collaboration | Culture & collaboration |
| situational | Situational |

### 5.3 状态标签

状态标签不使用评分数字，从 `session_feedback.mentor_overall` 推导：

**推导逻辑：**
```javascript
function getStatusLabel(mentorOverall) {
  if (!mentorOverall) return null; // 反馈未生成时不显示标签

  const { primary_gap, priority_1, priority_2 } = mentorOverall;
  const gapCount = [primary_gap, priority_1, priority_2]
    .filter(Boolean).length;

  if (gapCount <= 1) return 'strong';
  if (gapCount === 2) return 'growing';
  return 'developing';
}
```

**标签样式：**

| 标签值 | 显示文字 | 背景色 | 文字色 |
|--------|---------|--------|--------|
| `strong` | Strong | `var(--color-background-success)` | `var(--color-text-success)` |
| `growing` | Growing | `var(--color-background-info)` | `var(--color-text-info)` |
| `developing` | Developing | `var(--color-background-warning)` | `var(--color-text-warning)` |
| `null` | 不显示 | — | — |

**标签为 null 的情况：**
- `session_feedback` 尚未生成（`feedback_status != 'ready'`）
- 该条记录是 `abandoned` 状态的 session

### 5.4 各数据状态下的列表展示

**零状态（completed_sessions = 0）：**

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   No sessions yet.                                   │
│   Start your first practice to see it here.         │
│                                                      │
└──────────────────────────────────────────────────────┘
```
- 空状态卡片，居中文案，不显示「View all」
- 日历在上方正常显示（全空白）

**早期状态（1–4 条记录）：**
- 正常展示已有记录，不补足到 5 条
- 如果只有 1 条，只显示 1 条
- 不显示「View all」（记录太少，点进去也是一样的）

**正常状态（≥5 条记录）：**
- 展示最近 5 条
- 显示「View all →」

**点击日历某天（P1 增强）：**
- 该天有记录：显示当天所有记录，列表顶部出现 `[Jun 8 ×]` 过滤标签
- 该天无记录（不可点击，已在5.1定义）

---

## 6. 区域 4：资产概览

**优先级：P0**

### 6.1 展示结构

```
Your assets

┌──────────────────────┐  ┌──────────────────────┐
│  Answer bank          │  │  My resumes           │
│  12 answers saved    ›│  │  2 saved             ›│
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  JD history           │  │  Question library     │
│  4 roles saved       ›│  │  Browse questions    ›│
└──────────────────────┘  └──────────────────────┘
```

### 6.2 各状态展示

**Answer bank 卡片：**

| 状态 | 显示 |
|------|------|
| 0 条 | `No answers saved yet` |
| 1 条 | `1 answer saved` |
| N 条 | `N answers saved` |

**My resumes 卡片：**

| 状态 | 显示 |
|------|------|
| 0 条 | `No resumes saved` |
| 1 条 | `1 resume saved` |
| N 条 | `N resumes saved` |

**JD history 卡片：**

| 状态 | 显示 |
|------|------|
| 0 条 | `No JDs saved` |
| 1 条 | `1 role saved` |
| N 条 | `N roles saved` |

**Question library 卡片：**

| 状态 | 显示 |
|------|------|
| 默认 | `Browse questions` |

**点击行为：**
- Answer bank 卡片 → `router.push('/bank')`
- My resumes 卡片 → `router.push('/setup?panel=resumes')`，进入 Setup 并打开 saved resume picker
- JD history 卡片 → `router.push('/setup?panel=jd-history')`，进入 Setup 并打开 JD history picker
- Question library 卡片 → `router.push('/library')`

MVP 不单独创建 `/resumes` 或 `/jd-history` 管理页。简历和 JD 复用服务于快速开始练习，优先保持在 Setup 流程内完成。

---

## 7. 侧边栏

### 7.1 导航项

| 导航项 | 路由 | 图标 |
|--------|------|------|
| Home | `/home` | ti-layout-dashboard |
| Answer bank | `/bank` | ti-book |
| History | `/history` | ti-history |
| Question library | `/library` | ti-library |

当前页对应的导航项高亮（白色背景卡片）。

### 7.2 用户信息区（底部）

显示：Avatar 字母圆 + `display_name` + 邮箱（截断）

点击 → 下拉菜单：
```
miumiu@htw-berlin.de
─────────────────
Sign out
Change password  ← P2，灰色占位
```

---

## 8. 数据加载策略

### 8.1 并行请求

Dashboard 进入时，并行发起以下请求，不串行等待：

```javascript
const [sessionCount, practiceDays, recentSessions, assetCounts] = 
  await Promise.all([
    fetchSessionCount(),       // 区域 1 的标题数字
    fetchPracticeDays(),       // 区域 2 日历数据（84天）
    fetchRecentSessions(5),    // 区域 3 最近5条记录
    fetchAssetCounts(),        // 区域 4 资产数量（P0）
  ]);
```

### 8.2 加载状态

各区域独立加载，不等全部完成才渲染：

- 区域 1 标题：数字用 skeleton（灰色占位块），Mode 卡片立即渲染（无需数据）
- 区域 2 日历：整个日历区域用 skeleton，加载完后替换
- 区域 3 列表：用 3 条 skeleton row 占位
- 区域 4 资产：数字用 skeleton

### 8.3 错误处理

| 场景 | 处理 |
|------|------|
| 某个请求失败 | 该区域显示「Unable to load — refresh to retry」，不影响其他区域 |
| 全部请求失败 | 页面顶部显示「Connection issue — some data may be unavailable」banner |
| 用户未登录 | redirect 到登录页 |

---

## 9. 验收标准

### P0 必须通过

**区域 1：**
- [ ] `completed_sessions = 0` → 显示零状态（Welcome + Let's get started）
- [ ] `completed_sessions ≥ 1` → 显示「N sessions in. Keep going.」
- [ ] Mode 1 `Start →` 跳转 `/setup?mode=focused`
- [ ] Mode 2 整张卡片 opacity 降低，点击显示 tooltip，不跳转
- [ ] display_name 正确显示，fallback 到 email 前缀

**区域 2+3：**
- [ ] 日历正确渲染过去 84 天
- [ ] 有练习的天深色显示，无练习的天浅色
- [ ] hover 显示日期 tooltip
- [ ] 零状态下列表显示空状态文案
- [ ] 早期状态下只显示实际条数（不补足 5 条）
- [ ] 正常状态下显示最近 5 条，按时间倒序
- [ ] 点击记录行 → 进入对应反馈页（只读）
- [ ] 5 条以上时显示 `View all →`，跳转 `/history`

**侧边栏：**
- [ ] 当前页导航项高亮
- [ ] 用户名和邮箱正确显示
- [ ] Sign out 正常工作，跳转登录页

**区域 4：**
- [ ] 资产概览正常显示 Answer Bank、My resumes、JD history、Question Library 入口
- [ ] 已保存简历入口可进入 `/setup?panel=resumes`，并在设置页内打开 picker
- [ ] JD history 入口可进入 `/setup?panel=jd-history`，并在设置页内打开 picker
- [ ] 资产数量加载失败时显示局部错误，不影响开始练习

### P1 期望通过

- [ ] 日历色块点击过滤练习记录，出现过滤标签
- [ ] 再次点击取消过滤
- [ ] 状态标签（Strong / Growing / Developing）正确推导和显示
- [ ] 区域 4 资产卡片数量准确并支持高级筛选入口
- [ ] 数据加载时各区域独立显示 skeleton
- [ ] 某区域加载失败时显示局部错误提示，不影响其他区域

---

## 10. 设计禁止项

- 禁止在 Dashboard 展示评分数字（维持产品「诊断比评分重要」的一致性）
- 禁止用百分比或数字表示「进步了多少」（用日历色块和标签代替）
- 禁止在零状态下展示空图表、0分、空列表（让空白自己说话，或用引导文案替代）
- 禁止 Mode 2 点击时报错或跳转（显示 tooltip 即可）
- 禁止全部数据加载完才渲染页面（各区域独立加载）

---

*本文档取代主 PRD Section 3.7 中的 Dashboard 规格，以本文档为准。*
