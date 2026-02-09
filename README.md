# ACE Relay Frontend

ACE Relay 服务的前端控制台，用于管理 API Key、查看请求日志和用户排行榜。

## 技术栈

- **Next.js 16** (App Router)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + Radix UI 组件
- **PostgreSQL** — 持久化存储用户信息、API Key、请求日志、排行榜等业务数据，表在首次请求时自动创建
- **Redis** — 缓存 API Key 查询结果，减少高频场景下的数据库访问压力，Key 重置时自动失效缓存
- **Better Auth** + LinuxDo OAuth 认证

## 功能

- **LinuxDo OAuth 登录** — 通过 LinuxDo 社区账号单点登录，自动注册
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

数据库表会在首次请求时自动创建，无需手动迁移。

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm start        # 运行生产服务器
npm run lint     # ESLint 检查
```
