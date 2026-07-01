# OfferUp — Auth 模块完整规格

**文档性质** 功能规格文档，指导前端开发  
**版本** v1.0  
**更新时间** 2026-06-09  
**技术方案** Supabase Auth（不使用 NextAuth）  
**关联文档** 主 PRD · Dashboard 规格 · 设置模块规格

---

## 1. 页面结构

Auth 是**单页面**，内部切换 Sign in / Sign up 两种模式。

```
路由：/auth
子状态：?tab=signin（默认）| ?tab=signup
```

已登录用户访问 `/auth` → 直接 redirect 到 `/home`，不显示 Auth 页。

---

## 2. 页面布局

```
┌─────────────────────────────────────┐
│                                     │
│              OfferUp                 │  ← 产品名，点击回 Landing Page
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │  [Sign in]  [Sign up]       │   │  ← Tab 切换
│   │  ─────────                  │   │
│   │                             │   │
│   │  [Google 登录按钮]           │   │
│   │                             │   │
│   │  ── or ──                   │   │
│   │                             │   │
│   │  Email                      │   │
│   │  Password                   │   │
│   │  (Display name — Sign up)   │   │
│   │                             │   │
│   │  [主 CTA 按钮]               │   │
│   │                             │   │
│   │  切换提示文字                 │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**背景：** 浅色，与 Landing Page 一致，不用深色背景（深色留给面试会话）。

**卡片：** 居中，固定宽度 400px，有轻微边框，圆角。

---

## 3. Sign in 模式

### 3.1 字段

| 字段 | 类型 | 必填 | 验证 |
|------|------|------|------|
| Email | input[type=email] | ✅ | 合法 email 格式 |
| Password | input[type=password] | ✅ | ≥1 字符（登录不校验强度） |

### 3.2 操作

**Google 登录：** 最上方，`Continue with Google` 按钮，带 Google 图标。

**Email 登录：** 填写 Email + Password → 点击 `Sign in`。

**底部切换文字：**
```
Don't have an account? Sign up →
```
点击 → 切换到 Sign up tab（URL 更新为 `?tab=signup`，不跳转新页面）。

### 3.3 错误状态

| 场景 | 显示位置 | 文案 |
|------|---------|------|
| Email 不存在 | 表单下方 inline | `No account found with this email` |
| 密码错误 | 表单下方 inline | `Incorrect password` |
| Email 格式不合法 | Email 字段下方 | `Please enter a valid email` |
| 网络错误 | 表单下方 inline | `Something went wrong — please try again` |

**注意：** 不合并「邮箱不存在」和「密码错误」成「邮箱或密码不正确」——这个产品不是高安全性场景，分开提示更友好，减少用户困惑。

### 3.4 加载状态

点击 `Sign in` 后：
- 按钮变为 loading 状态（spinner + 文字变为 `Signing in...`）
- 表单字段禁用，不可再次提交
- 成功后执行 redirect 逻辑

---

## 4. Sign up 模式

### 4.1 字段

| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|---------|
| Display name | input[type=text] | ✅ | 1–50 字符，去除首尾空格后非空 |
| Email | input[type=email] | ✅ | 合法 email 格式 |
| Password | input[type=password] | ✅ | ≥8 字符 |

**字段顺序：** Display name 最上（视觉上「先认识你」），然后 Email，然后 Password。

**Display name 说明文字（字段下方小字）：**
```
This is how we'll address you — you can change it later.
```

**密码强度提示（实时，字段下方）：**
```
< 8 字符：（不显示，只在提交时报错）
= 8 字符：Weak（红色）
8-11 字符含数字或符号：Fair（黄色）
≥12 字符 或 含大小写+数字：Strong（绿色）
```
强度提示是辅助信息，不阻止提交（只要 ≥8 字符就允许）。

### 4.2 操作

**Google 注册：** 最上方，`Continue with Google` 按钮。
- Google OAuth 注册后，Display name 从 Google profile 自动获取
- 如果 Google 账号邮箱已有 Email 注册的账号，Supabase 自动合并（行为由 Supabase 处理，前端无需特殊处理）

**Email 注册：** 填写三个字段 → 点击 `Create account`。

**底部切换文字：**
```
Already have an account? Sign in →
```

### 4.3 错误状态

| 场景 | 显示位置 | 文案 |
|------|---------|------|
| Email 已注册 | Email 字段下方 | `An account with this email already exists` |
| 密码少于 8 位 | Password 字段下方 | `Password must be at least 8 characters` |
| Display name 为空 | 字段下方 | `Please enter a display name` |
| Email 格式不合法 | 字段下方 | `Please enter a valid email` |
| 网络错误 | 表单下方 | `Something went wrong — please try again` |

### 4.4 注册成功后

注册成功后**不发送验证邮件**（MVP 阶段关闭 Supabase email confirmation）。

直接登录，执行 redirect 逻辑。

---

## 5. Redirect 逻辑

这是 Auth 模块最重要的逻辑。不同入口进来的用户，登录/注册完成后去不同的地方。

### 5.1 Redirect 规则

```
登录/注册成功后：

if (有 returnTo 参数)
  → 跳转到 returnTo 指定的页面
else if (是首次注册)
  → 跳转到 /setup?mode=focused（直接开始第一次练习）
else
  → 跳转到 /home（回主页）
```

### 5.2 returnTo 参数的设置时机

| 触发场景 | returnTo 值 | 说明 |
|---------|------------|------|
| Landing Page CTA 点击（未登录） | `/setup?mode=focused` | 直接进入设置流程 |
| 访问任何需要登录的页面 | 原目标页面 URL | 登录后回到原来想去的地方 |
| 直接访问 `/auth` | 无 returnTo | 走 else 分支 |

**URL 格式：**
```
/auth?tab=signin&returnTo=/setup?mode=focused
/auth?tab=signup&returnTo=/home
```

**安全规则：** returnTo 必须是站内路径（以 `/` 开头），拒绝外部 URL redirect，防止 open redirect 攻击。

```javascript
const isSafeRedirect = (url) => url.startsWith('/') && !url.startsWith('//');
```

### 5.3 首次注册的判断

```javascript
// Supabase 注册成功后，检查是否是首次
const { data: { user } } = await supabase.auth.signUp({...});
const isNewUser = user.created_at === user.last_sign_in_at;
// 或者：检查 interview_sessions count === 0
```

### 5.4 Google OAuth Redirect

Google OAuth 的 callback 经过 `/auth/callback` 路由（Supabase 自动处理）。
完成后 Supabase 会 redirect 到配置的 `redirectTo` URL。

**配置方式：**
```javascript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?returnTo=${returnTo}`
  }
});
```

---

## 6. Session 管理

### 6.1 Session 持久化

使用 Supabase 默认的 localStorage 持久化，刷新页面不退出。

### 6.2 Session 过期处理

Supabase 默认 access token 有效期 1 小时，refresh token 有效期 7 天。

| 场景 | 处理 |
|------|------|
| Access token 过期，refresh token 有效 | Supabase SDK 自动刷新，用户无感知 |
| Refresh token 也过期（7 天未使用） | 访问任何需要登录的页面时，redirect 到 `/auth?returnTo=原页面` |
| 用户主动 Sign out | 清除 session，跳转 `/` (Landing Page) |

### 6.3 需要登录的页面保护

所有以下路由需要登录，未登录时 redirect 到 Auth 页：

```
/home
/setup
/session/*
/bank
/history
/library
```

**实现方式：** Next.js middleware，检查 Supabase session cookie。

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const protectedPaths = ['/home', '/setup', '/session', '/bank', '/history', '/library'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));
  
  if (isProtected && !session) {
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    return NextResponse.redirect(
      new URL(`/auth?returnTo=${encodeURIComponent(returnTo)}`, request.url)
    );
  }
}
```

---

## 7. 数据写入（注册时）

注册成功后，同步创建 `profiles` 记录：

```javascript
// 在 Supabase Auth trigger 或注册后立即调用
await supabase.from('profiles').insert({
  id: user.id,
  display_name: displayName, // Email 注册时用用户输入的值
                              // Google 注册时用 user.user_metadata.full_name
  created_at: new Date().toISOString()
});
```

**Google OAuth 的 display_name 获取：**
```javascript
const displayName = user.user_metadata?.full_name
  || user.user_metadata?.name
  || user.email.split('@')[0]; // fallback 到 email 前缀
```

---

## 8. UI 细节

### 8.1 Tab 切换动效

Sign in / Sign up tab 切换时：
- Display name 字段在 Sign up 时出现（fade in），Sign in 时消失（fade out）
- 不做页面跳转，URL query 参数更新
- 切换时清空所有错误提示，不清空已填写的 Email（用户常常切换后发现要改模式，保留 Email 减少重填）

### 8.2 Google 按钮样式

遵循 Google 品牌规范：
- 白色背景，黑色文字，Google logo 图标
- 文字：`Continue with Google`
- 宽度 100%，与 Email 输入框等宽

### 8.3 Password 字段

- 右侧有显示/隐藏切换图标（ti-eye / ti-eye-off）
- 默认隐藏（`type=password`）

### 8.4 提交条件

**Sign in：** Email 格式合法 + Password 非空 → 按钮可点击
**Sign up：** Display name 非空 + Email 格式合法 + Password ≥8 字符 → 按钮可点击

未满足条件时按钮不禁用（避免用户困惑），点击后执行验证并显示对应错误。

---

## 9. 验收标准

### P0 必须通过

**页面基础：**
- [ ] `/auth` 正确渲染，默认显示 Sign in tab
- [ ] `?tab=signup` 显示 Sign up tab
- [ ] 已登录用户访问 `/auth` → redirect 到 `/home`

**Sign in：**
- [ ] Email + Password 登录成功 → 执行 redirect 逻辑
- [ ] 邮箱不存在 → 显示对应错误文案
- [ ] 密码错误 → 显示对应错误文案
- [ ] 点击「Sign up →」→ 切换到 Sign up tab，URL 更新

**Sign up：**
- [ ] Display name + Email + Password 注册成功
- [ ] 注册成功后 → 跳转 `/setup?mode=focused`
- [ ] Email 已注册 → 显示对应错误文案
- [ ] 密码少于 8 位 → 显示错误文案
- [ ] 注册成功后 profiles 表正确写入 display_name

**Google OAuth：**
- [ ] `Continue with Google` 跳转 Google 授权页
- [ ] 授权完成后 callback 处理正确，执行 redirect 逻辑

**Redirect：**
- [ ] 有 returnTo → 登录后跳转 returnTo
- [ ] 无 returnTo + 新用户 → 跳转 `/setup?mode=focused`
- [ ] 无 returnTo + 老用户 → 跳转 `/home`
- [ ] returnTo 为外部 URL → 拒绝，跳转 `/home`

**Session 保护：**
- [ ] 未登录访问 `/home` → redirect 到 `/auth?returnTo=/home`
- [ ] 登录后 session 持久化，刷新不退出
- [ ] Sign out → session 清除，跳转 Landing Page

### P1 期望通过

- [ ] 密码强度提示实时显示（Weak / Fair / Strong）
- [ ] Password 显示/隐藏切换
- [ ] Tab 切换时 Display name 字段 fade in/out
- [ ] Tab 切换时保留已填写的 Email

---

## 10. 不做的事（MVP 范围外）

- 邮件验证（关闭 Supabase email confirmation）
- 忘记密码 / 重置密码
- 修改密码（页面有占位入口，功能 P2）
- GitHub / LinkedIn OAuth
- 多设备 session 管理
- 账号删除

---

*Supabase Auth 配置细节（Google OAuth client ID、redirect URL 白名单等）在部署文档中维护，不在本规格中定义。*
