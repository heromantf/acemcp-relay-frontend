# ACE Relay Frontend

ACE Relay 服务的前端控制台，用于管理 API Key、查看请求日志和用户排行榜。

## 技术栈

- **Next.js 16** (App Router)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + Radix UI 组件
- **PostgreSQL** — 持久化存储用户信息、API Key、请求日志、排行榜等业务数据，表在首次请求时自动创建
- **Redis** — 缓存 API Key 查询结果，减少高频场景下的数据库访问压力，Key 重置时自动失效缓存
- **Better Auth** + LinuxDo / GitHub OAuth 认证

## 功能

- **多方式 OAuth 登录** — 支持 LinuxDo / GitHub 单点登录；GitHub 登录会校验账号注册年龄，拒绝过新的账号
- **API Key 管理** — 生成、查看、重置 API Key，支持一键复制
- **请求日志** — 分页查看请求记录，包含方法、状态码、耗时、IP 等详情，支持自动刷新
- **请求统计** — 展示成功/失败/总计请求数
- **每日排行榜** — Top 10 用户请求量排名，支持日期切换查看历史数据
- **MCP 配置文档** — 提供 Auggie CLI 安装指引与 MCP 配置模板

## 项目结构

```
app/
├── page.tsx                 # 首页
├── login/page.tsx           # 登录页
├── console/page.tsx         # 控制台（Key管理/文档/日志/个人信息）
├── leaderboard/page.tsx     # 排行榜
├── api/
│   ├── auth/[...all]/       # OAuth 认证
│   ├── user/                # 用户信息
│   ├── key/                 # API Key 管理
│   ├── key/reveal/          # 查看完整 Key
│   ├── logs/                # 请求日志列表
│   ├── logs/[id]/           # 日志详情
│   └── leaderboard/         # 排行榜数据
components/                  # UI 组件
lib/
├── auth.ts                  # 认证配置
├── auth-client.ts           # 客户端认证
├── db.ts                    # 数据库操作
└── utils.ts                 # 工具函数
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
cp .env.example .env.local
```

| 变量 | 说明 | 示例 |
|------|------|------|
| `BETTER_AUTH_URL` | 应用 URL | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Auth 加密密钥 | 随机字符串 |
| `AUTH_LINUXDO_ID` | LinuxDo OAuth Client ID | 从 LinuxDo 获取 |
| `AUTH_LINUXDO_SECRET` | LinuxDo OAuth Client Secret | 从 LinuxDo 获取 |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | 从 GitHub 获取 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | 从 GitHub 获取 |
| `AUTH_GITHUB_MIN_ACCOUNT_AGE_DAYS` | GitHub 新注册用户最小账号年龄（天），留空或非法值默认 `365`，设为 `0` 关闭校验 | `365` |
| `POSTGRES_HOST` | PostgreSQL 主机 | `localhost` |
| `POSTGRES_PORT` | PostgreSQL 端口 | `5432` |
| `POSTGRES_USER` | PostgreSQL 用户名 | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | - |
| `POSTGRES_DB` | PostgreSQL 数据库名 | `postgres` |
| `REDIS_HOST` | Redis 主机 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

核心表（`user`/`session`/`account`）在首次请求时由 Better Auth 自动创建；业务表（`api_keys` 等）在服务启动时自动创建。

## OAuth 接入说明

### GitHub OAuth App
1. 到 [GitHub Developer Portal](https://github.com/settings/developers) 创建 OAuth App
2. Authorization callback URL 填 `<BETTER_AUTH_URL>/api/auth/callback/github`（例如本地 `http://localhost:3000/api/auth/callback/github`）
3. 拿到 Client ID / Secret 填入 `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
4. 如果创建的是 **GitHub App** 而非 OAuth App，额外需到 *Permissions → Account Permissions → Email Addresses* 开 **Read-Only**，否则登录会报 `email_not_found`

### 新增 / 修改 `additionalFields` 后的 schema 同步
项目在 `lib/auth.ts` 的 `user.additionalFields` 中声明了自定义列（`trustLevel`、`username`、`githubCreatedAt`）。Better Auth 只会在首次建表时按配置生成列；**对已有表新增字段**需手动同步，有两种方式：

```bash
# 方式 A：用官方 CLI（推荐，自动 diff schema）
npx @better-auth/cli@latest migrate -y

# 方式 B：手动 ALTER（例如新增 GitHub 注册时间列）
psql $DATABASE_URL -c 'ALTER TABLE "user" ADD COLUMN "githubCreatedAt" TIMESTAMP;'
```

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm start        # 运行生产服务器
npm run lint     # ESLint 检查
```
