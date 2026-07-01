# vexmotor-web

VexMotor 前台商城（Next.js App Router SSR）。从单体 `vexmotor` 拆分而来，运行于 **http://localhost:5000**。

**不含** `next-auth`、`drizzle`、`postgres`、`src/server` — 所有数据经 `vexmotor-admin` 的 `/api/front/*` 获取。

## 快速开始

```bash
pnpm install
cp .env.example .env
pnpm dev   # http://localhost:5000
```

需同时启动 `vexmotor-admin`（:5100）。

## 环境变量

| 变量 | 说明 |
|------|------|
| `API_URL` | Admin API 根地址（必填） |
| `SITE_URL` | 本站 URL（必填，用于 SEO / sitemap / JSON-LD） |

## 数据获取

| 场景 | 模块 | 说明 |
|------|------|------|
| Server Component / SSR | `serverFetch` in `@/lib/api-client` | 无用户 token，带 `x-vex-locale` |
| Client Component | `apiFetch` | Bearer JWT + `X-Cart-Token` |
| 登录/注册 | `@/lib/auth-client` | JWT 存 localStorage |
| 页面数据 | `@/lib/storefront-api` | 封装常用前台 API |

## 认证

- 邮箱密码：`POST /api/front/auth/login` → 存 JWT → `AuthProvider` 拉 profile
- OAuth：跳转 `{API_URL}/api/front/auth/oauth/google` → admin 302 到 `/auth/callback?token=...`
- 会员私有页（account/*）客户端加载，公开页保持 SSR + `generateMetadata`

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发 :5000 |
| `pnpm build` | 生产构建 |
| `pnpm typecheck` | TypeScript 检查 |

## 禁止项

勿在本项目引入或调用：

- `next-auth`
- `drizzle-orm` / `postgres`
- `@/server/*` 直调
