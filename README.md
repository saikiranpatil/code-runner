# ⚡ Code Runner

> A production-grade, containerized remote code execution platform with a distributed job queue, multi-strategy authentication, and a type-safe full-stack architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5-FF6B6B?logo=redis&logoColor=white)](https://docs.bullmq.io/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E.svg)](LICENSE)

---

## Overview

Code Runner is a distributed system for safely executing arbitrary user-submitted code in isolated, ephemeral Docker containers. It is built around two core concerns: **security** (every submission runs in a sandboxed, resource-limited container that is destroyed after use) and **scalability** (the API server and execution worker are decoupled processes connected through a persistent Redis job queue, allowing each to scale independently).

The project covers the full stack — from a cloud-ready NestJS API with multi-strategy auth, a standalone BullMQ worker, and a Prisma-backed PostgreSQL data layer, to a React SPA with a Monaco-powered code editor, Zustand state management, and a type-safe custom API layer built on TanStack Query.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│        React + Vite SPA │ Monaco Editor │ Zustand + TanStack │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP / REST
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                       Nginx (Port 80)                        │
│          Reverse Proxy + Static File Server                  │
│   /api/* → Express Backend    /  → React SPA (nginx:80)     │
└──────────────────┬────────────────────────────┬─────────────┘
                   │                            │
                   ▼                            ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│      NestJS API Server   │     │     Frontend (nginx)      │
│  Auth │ Jobs │ Results   │     │   Static build artifacts  │
│   (Node.js / Port 3000)  │     └──────────────────────────┘
└──────────┬───────────────┘
           │  Enqueue / Fetch Job
           ▼
┌──────────────────────────┐
│     Redis (BullMQ)       │  ← Persistent job store
│   Job Queue + Results    │
└──────────┬───────────────┘
           │  Dequeue Job
           ▼
┌──────────────────────────┐
│   NestJS Worker Process  │  ← Separate deployable unit
│   BullMQ Processor       │
└──────────┬───────────────┘
           │  spawn()
           ▼
┌──────────────────────────┐
│  Docker (Host Daemon)    │  ← One ephemeral container
│  Isolated Execution      │    per submission
│  stdout / stderr / exit  │
└──────────────────────────┘
           │
┌──────────────────────────┐
│   PostgreSQL (Prisma)    │  ← User accounts, tokens
└──────────────────────────┘
```

---

## Services

| Service | Technology | Responsibility |
|---|---|---|
| **api** | NestJS (Node.js 22) | REST API — auth, job submission, result polling |
| **worker** | NestJS (standalone) | Dequeues jobs, spawns and monitors Docker containers |
| **redis** | Redis 7 Alpine | Persistent BullMQ job queue and result store |
| **redis-insight** | RedisInsight 2.54 | Web GUI for Redis inspection (dev, port 5540) |
| **postgres** | PostgreSQL 16 Alpine | User records, hashed refresh tokens, OAuth profiles |
| **nginx** | Nginx Alpine | Reverse proxy, load balancer, static file serving |
| **frontend** | Nginx (serving Vite build) | React SPA static assets |

---

## Feature Breakdown

### Code Execution Engine

- **Per-submission container isolation** — `executor.service.ts` uses Node.js `child_process.spawn` to invoke `docker run` directly, creating a fresh ephemeral container for every job. Containers are destroyed after execution, preventing state leakage between users.
- **Resource safety** — configurable hard limits on execution time (`WORKER_EXECUTION_TIMEOUT_MS`), stdout/stderr byte output (`WORKER_MAX_OUTPUT_BYTES`), and OOM kill detection via Docker's exit code signals.
- **Structured result payload** — every execution returns `{ stdout, stderr, exitCode, timedOut, oomKilled, outputLimitHit }`, giving the frontend enough signal to render precise, informative feedback.
- **Language configuration system** — `languages.config.ts` maps language identifiers to Docker images and invocation commands, making it trivial to add new runtimes without touching execution logic.
- **Worker/server decoupling** — the worker (`worker.ts`) has its own NestJS entry point and its own `nest-cli` configuration (`worker-cli.json`). This means the API server and execution worker can be deployed and scaled entirely independently — horizontal scaling of workers does not require touching the API layer.

### Job Queue (BullMQ + Redis)

- **Persistent queue** — jobs survive application restarts because Redis persists them. A submission is never silently lost even if the worker crashes mid-flight.
- **Separate processor class** — `ExecutorProcessor` extends `WorkerHost` and implements BullMQ lifecycle hooks (`onCompleted`, `onFailed`, `onClosed`, `onError`) for full observability of worker health.
- **Configurable concurrency** — `WORKER_CONCURRENCY` controls how many containers a single worker instance runs in parallel, decoupling CPU/container limits from queue throughput.
- **Result polling** — clients poll `GET /result/:jobId` to retrieve job state and execution output; the API proxies to BullMQ's job store, mapping queue states (`waiting`, `active`, `completed`, `failed`) to a clean response contract.

### Authentication

A production-grade, multi-strategy authentication system implemented with Passport.js strategies and NestJS guards:

#### Local (Email + Password)
- Passwords are hashed with **bcrypt** at a configurable round factor (`BCRYPT_ROUNDS`).
- The `LocalStrategy` authenticates credentials and hands off to `AuthService.login()`, which generates a token pair.

#### JWT Access + Refresh Token Rotation
- **Short-lived access tokens** are signed with `JWT_SECRET` and sent in the response body for in-memory storage on the client.
- **Long-lived refresh tokens** are sent as **httpOnly cookies**, making them invisible to JavaScript and resilient to XSS attacks.
- Refresh tokens are **bcrypt-hashed before storage** in PostgreSQL — if the database is ever compromised, raw refresh tokens are not exposed.
- The `JwtRefreshStrategy` extracts the token from the cookie, validates it against the stored hash, and issues a new access+refresh pair (rotation), invalidating the old refresh token immediately.
- The global `JwtAuthGuard` is applied to all routes by default via `APP_GUARD`. Routes that must be publicly accessible are decorated with `@Public()`, which sets `IS_PUBLIC_KEY` metadata that the guard checks via `Reflector` before invoking the JWT strategy.

#### OAuth 2.0 (GitHub + Google)
- Separate Passport strategies for GitHub (`passport-github2`) and Google (`passport-google-oauth20`), each with dedicated callback URLs and guards.
- On first OAuth login, `UsersService.createOAuthUser()` creates an account with a random secure `passwordHash` (a random 32-byte hex string), making local login impossible for OAuth accounts and preventing password-based attacks on those accounts.
- **OAuth uses a popup window, not a page redirect.** When the user clicks "Continue with GitHub/Google", the frontend opens a small popup window (`handleOAuthClick` in `Oauth.ts`). The OAuth callback page (`OAuthCallback.tsx`) posts the received tokens back to the opener via `window.postMessage`. This means the user never loses their current page state or editor content during authentication — a meaningfully better UX than full-page redirect.

### API Layer (Frontend)

The frontend's API communication is built around a typed route definition system inspired by [ohcnetwork/care_fe](https://github.com/ohcnetwork/care_fe/blob/develop/src/Utils/request/README.md):

- **`defineRoute<TRes, TBody>()`** — every endpoint is declared once as a typed object containing `path`, `method`, and TypeScript phantom types `TRes`/`TBody`. This acts as the single source of truth: change a route's type here and TypeScript propagates the error to every call site immediately.
- **`callApi()` / `query()` / `mutate()`** — thin wrappers over Axios that accept a typed route object and options (`pathParams`, `queryParams`, `body`), automatically build the URL with parameter interpolation, inject the auth token, and return `TRes` directly.
- **Token refresh with request queuing** — the Axios response interceptor intercepts `401` responses and attempts a silent token refresh. While the refresh is in flight, all other concurrent requests are held in a queue. When refresh succeeds, every queued request is replayed with the new token. If refresh fails, the queue is flushed with the error and the user is logged out. This prevents multiple simultaneous refresh calls (a common race condition) and ensures no requests are silently dropped.

### State Management (Zustand)

- A single `useAuthStore` slice manages `user`, `token`, `status`, and `isAuthenticated`.
- `status` goes through a deliberate lifecycle: `idle → loading → authenticated | unauthenticated`. The `ProtectedRoute` and `PublicRoute` wrappers read this status to show a spinner during the initial auth check rather than flickering between layouts.
- On `handleLogin`, a `setTimeout` is scheduled to silently refresh the access token ~60 seconds before expiry (`tokenSecondsRemaining` + buffer). The timer reference is stored in the Zustand state so it can be cleared on logout, preventing phantom refresh calls after the user signs out.
- `getAuthState()` exports a non-reactive getter for use in the Axios interceptor — reading from Zustand outside of React without triggering a subscription.

### Observability & Reliability

- **Structured JSON logging** via `nestjs-pino` — in production, every log line is a JSON object parseable by cloud logging infrastructure (Datadog, CloudWatch, etc.). In development, `pino-pretty` formats logs for readability. The choice of pino over NestJS's built-in logger is deliberate: the built-in logger is not JSON by default, making log analysis at scale impractical.
- **Global HTTP exception filter** (`HttpExceptionFilter`) catches both NestJS `HttpException` and Prisma-specific errors (constraint violations, not-found, etc.), translating them into a consistent `{ success, message, errors, path, timestamp }` error envelope.
- **Response transform interceptor** (`ResponseTransformInterceptor`) wraps every successful response in `{ success: true, message, data: T }`, giving API consumers a uniform contract regardless of endpoint.
- **Graceful shutdown** — `ShutdownService` implements `OnApplicationShutdown` and maintains a list of async cleanup callbacks. The Prisma service registers its `$disconnect()` call on init, ensuring the database connection pool is cleanly drained before the process exits rather than being killed mid-query.
- **Custom `IsSupportedLanguage` validator** — a `class-validator` decorator that validates submitted language identifiers against the runtime language config, keeping validation logic co-located with the config it validates.

---

## Tech Stack

### Backend

| Category | Technology | Notes |
|---|---|---|
| Framework | NestJS 11 | Modular architecture, DI container |
| Language | TypeScript 5.7 | `strictNullChecks`, decorator metadata |
| ORM | Prisma 7 | Custom output path, PrismaPg adapter |
| Database | PostgreSQL 16 | User accounts, hashed refresh tokens |
| Job Queue | BullMQ 5 + Redis 7 | Persistent, distributed job processing |
| Auth | Passport.js | Local, JWT, JWT-Refresh, GitHub, Google |
| Tokens | `@nestjs/jwt` | HS256 access tokens, httpOnly refresh cookies |
| Password | bcrypt | Configurable salt rounds |
| Logging | nestjs-pino + pino-http | Structured JSON logs, pretty-print in dev |
| Validation | class-validator + Zod | DTOs + Zod pipe for schema-first validation |
| API Docs | Swagger / OpenAPI | Auto-generated from decorators |
| HTTP | Express (via NestJS) | cookie-parser, CORS config |
| Container | Docker SDK (child_process) | `docker run` via `spawn()` |

### Frontend

| Category | Technology | Notes |
|---|---|---|
| Framework | React 19 | Concurrent features |
| Build Tool | Vite 7 | HMR, ES modules |
| Language | TypeScript 5.9 | Strict mode |
| State | Zustand 5 | Devtools middleware |
| Server State | TanStack Query 5 | Query + mutation wrappers |
| HTTP Client | Axios | Interceptors, refresh queue |
| Code Editor | Monaco Editor 0.55 | VS Code engine, language-aware |
| Routing | React Router 7 | Protected/public route wrappers |
| UI Components | shadcn/ui + Radix UI | Accessible primitives |
| Styling | Tailwind CSS 4 | CSS variables, custom theme |
| Animations | Framer Motion 12 | Page transitions, auth form |
| Forms | React Hook Form 7 + Zod | Schema-validated forms |
| Toasts | Sonner 2 | Notification system |
| Icons | Lucide React + Remixicon | |

### Infrastructure

| Component | Technology |
|---|---|
| Reverse Proxy | Nginx (Alpine) |
| Container Runtime | Docker + Docker Compose v2 |
| CI Packaging | Multi-stage Dockerfiles (Node 22 → slim) |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- Node.js 22+ (for local development without Docker)
- Git

### Environment Setup

**Backend** (`backend/.env` from `backend/.env.template`):

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

REDIS_HOST=redis
REDIS_PORT=6379

WORKER_CONCURRENCY=4
WORKER_EXECUTION_TIMEOUT_MS=10000
WORKER_MAX_OUTPUT_BYTES=102400

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code-runner

JWT_SECRET=your-strong-secret
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-strong-refresh-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Frontend** (`frontend/.env` from `frontend/.env.template`):

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Run with Docker Compose

```bash
git clone https://github.com/saikiranpatil/code-runner.git
cd code-runner

# Start infrastructure services
docker compose up -d

# Run database migrations
cd backend
npx prisma migrate deploy

# Pull execution language images
npx ts-node pull-language-images.ts
```

### Local Development

```bash
# Terminal 1 — API server
cd backend
npm install
npm run start:dev

# Terminal 2 — BullMQ worker (separate process)
cd backend
npm run worker:dev

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- API Docs (Swagger): `http://localhost:3000/api`
- Redis Insight: `http://localhost:5540`

---

## API Reference

All responses follow the envelope contract:

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": [], "path": "...", "timestamp": "..." }
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Email/password login |
| `POST` | `/auth/register` | Public | Create account |
| `POST` | `/auth/logout` | JWT | Invalidate refresh token |
| `POST` | `/auth/refresh` | Refresh Cookie | Issue new token pair |
| `GET` | `/auth/github` | Public | Initiate GitHub OAuth |
| `GET` | `/auth/github/callback` | Public | GitHub OAuth callback |
| `GET` | `/auth/google` | Public | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | Public | Google OAuth callback |

### Code Execution

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/execute` | JWT | Submit code for execution |
| `GET` | `/result/:jobId` | JWT | Poll job state and result |

**Submit Execution:**
```json
POST /execute
{
  "code": "print('Hello, World!')",
  "language": "python",
  "stdin": ""
}
```

**Result Response:**
```json
{
  "state": "completed",
  "result": {
    "stdout": "Hello, World!\n",
    "stderr": "",
    "exitCode": 0,
    "timedOut": false,
    "oomKilled": false,
    "outputLimitHit": false
  },
  "error": null
}
```

---

## Project Structure

```
code-runner/
├── backend/
│   ├── prisma/
│   │   ├── migrations/         # SQL migration history
│   │   ├── schema.prisma       # Data model (User)
│   │   └── seed.ts             # Database seeder
│   ├── src/
│   │   ├── auth/
│   │   │   ├── dto/            # LoginDto, RegisterDto (class-validator)
│   │   │   ├── guards/         # JWT, JWTRefresh, Local, GitHub, Google guards
│   │   │   ├── strategies/     # Passport strategies (5 total)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts # Token generation, bcrypt, rotation
│   │   │   ├── auth.decorators.ts  # @Public() decorator
│   │   │   └── auth.provider.ts    # Global JwtAuthGuard registration
│   │   ├── common/
│   │   │   ├── constants/      # Strategy names, cookie names, env enum
│   │   │   ├── types/          # JwtPayload, JwtRefreshPayload interfaces
│   │   │   └── zod/            # ZodValidationPipe
│   │   ├── config/
│   │   │   ├── env.config.ts   # Validated env object (Zod schema)
│   │   │   ├── env.schema.ts   # Zod env schema with ms() time parsing
│   │   │   ├── jwt.config.ts   # JwtModuleOptions factories
│   │   │   ├── languages.config.ts  # Language → Docker image + cmd map
│   │   │   ├── logger.config.ts     # nestjs-pino config (env-aware)
│   │   │   └── redis.config.ts      # BullMQ Redis connection options
│   │   ├── execution/
│   │   │   ├── dto/            # ExecutionDto with @IsSupportedLanguage
│   │   │   ├── execution.module.ts  # BullMQ queue + processor registration
│   │   │   ├── execution.processor.ts  # WorkerHost + lifecycle hooks
│   │   │   ├── execution.types.ts   # ExecutionResult interface
│   │   │   └── executor.service.ts  # docker run via spawn(), safety limits
│   │   ├── prisma/             # PrismaService (PrismaPg adapter, shutdown hook)
│   │   ├── shutdown/           # ShutdownService (graceful cleanup registry)
│   │   ├── users/              # UsersService (CRUD + OAuth user creation)
│   │   ├── validators/         # IsSupportedLanguage custom validator
│   │   ├── app.module.ts       # Root module composition
│   │   ├── http-exception.filter.ts    # Global error + Prisma error handler
│   │   ├── main.ts             # API server bootstrap
│   │   ├── response-transform.interceptor.ts  # Response envelope
│   │   └── worker.ts           # Worker process bootstrap (separate entry)
│   ├── nest-cli.json           # API server CLI config
│   ├── worker-cli.json         # Worker CLI config (separate entryFile)
│   └── pull-language-images.ts # Utility: docker pull all language images
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.ts        # Axios instance + refresh interceptor + queue
│   │   │   └── types.ts        # ApiResponse, ApiErrorResponse envelopes
│   │   ├── common/
│   │   │   ├── components/     # CodeEditor (Monaco), ThemeProvider
│   │   │   ├── layout/         # Navbar, ProtectedRoute, PublicRoute, ErrorBoundary
│   │   │   ├── constants.ts    # LANGUAGES config + Language type
│   │   │   └── urls.ts         # Typed app URL constants
│   │   ├── components/
│   │   │   ├── auth/           # Login, Register, AuthFormLayout, SidePanel, OAuth util
│   │   │   ├── problems/       # Problem.tsx — editor + execution UI
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── hooks/
│   │   │   └── useExecution.ts # Execution submit + result polling hook
│   │   ├── pages/              # NotFoundPage, OAuthCallback
│   │   ├── routes/             # AppRouter (protected/public tree)
│   │   ├── store/
│   │   │   └── auth.store.ts   # Zustand auth slice + refresh timer
│   │   ├── types/
│   │   │   ├── auth/           # User, AuthSuccessPayload, authApi routes
│   │   │   └── execution/      # ExecutionResult, executionApi routes
│   │   └── utils/
│   │       ├── request/        # defineRoute, callApi, query, mutate, queryClient
│   │       ├── errorHandler.ts # Axios error → ParsedError
│   │       ├── index.ts        # buildUrl (path param interpolation)
│   │       └── token.ts        # tokenSecondsRemaining, isTokenExpiringSoon
│   └── vite.config.ts
│
├── nginx/
│   └── nginx.conf              # Upstream proxying + static serving
└── docker-compose.yml          # Full infrastructure orchestration
```

---

## Key Engineering Decisions

### Worker/Server Process Separation

The NestJS application has two distinct entry points: `main.ts` (API) and `worker.ts` (queue processor), each with its own `nest-cli` config. This is not just organizational — it means these two processes can be containerized separately, deployed on different machines, and scaled at different rates. A traffic spike increases API replicas; a surge in job submissions increases worker replicas. Neither affects the other.

### httpOnly Cookie Refresh Tokens + In-Memory Access Tokens

Access tokens are stored in JavaScript memory (Zustand state), not `localStorage`. Refresh tokens travel exclusively as httpOnly cookies, making them inaccessible to JavaScript entirely. This combination is resistant to both XSS (refresh token is never exposed to scripts) and CSRF (access token is not in a cookie, so CSRF attacks cannot use it as Bearer auth).

### Refresh Token Hashing

Refresh tokens are hashed with bcrypt before storage in the database, mirroring the same approach used for passwords. This means that even if an attacker gains read access to the `users` table, they cannot use the stored values to impersonate users — they would need to brute-force bcrypt, which is computationally infeasible at appropriate cost factors.

### OAuth via Popup Window

Most OAuth implementations redirect the current page to the provider and back. This project uses a popup window + `postMessage` instead. The main page opens a small browser popup, the OAuth flow completes there, and the popup sends `{ accessToken, user, expiresIn }` back to the opener via `window.postMessage`. The popup closes itself, and the user's editor content and page state are completely preserved. This pattern significantly improves UX in single-page code editor contexts.

### Request Queue During Token Refresh

When an access token expires, multiple concurrent requests may all receive a `401` simultaneously. A naive implementation would fire multiple refresh calls, invalidating each other (token rotation means only the first refresh succeeds; subsequent ones fail because the token was already rotated). The Axios interceptor solves this with a request queue: the first `401` triggers a refresh and sets `isRefreshing = true`; all subsequent `401`s during that window are pushed onto a queue. When the single refresh resolves, the queue is drained and all held requests are replayed with the new token.

### Type-Safe Route Definitions

API routes are defined with a `defineRoute<TRes, TBody>()` helper that creates phantom-typed route objects. This means the TypeScript compiler knows the response type of every API call at every call site — no `any`, no manual type assertions. If an endpoint's contract changes, the type error appears at the call site, not at runtime in production.

### Structured JSON Logging

`nestjs-pino` replaces NestJS's built-in logger to emit structured JSON in production. This is a deliberate infrastructure decision: JSON logs are indexable, queryable, and analyzable in cloud logging tools (Datadog, CloudWatch, Loki) without custom parsing. In development, `pino-pretty` transforms the same logs into human-readable colored output.

---

## Security Considerations

- **Container isolation** — every code submission runs in a fresh `docker run` invocation. Containers are not reused across submissions; there is no persistent filesystem available to user code.
- **No Docker-in-Docker** — the worker mounts the host Docker socket (`/var/run/docker.sock`) to spawn containers on the host daemon directly. This avoids the complexity and overhead of nested container runtimes.
- **Resource limits** — execution timeout, output byte cap, and OOM kill detection prevent runaway processes, fork bombs, and infinite-output attacks. Exit conditions are tracked in the result payload.
- **httpOnly refresh cookies** — refresh tokens are inaccessible to JavaScript. The `Secure` flag should be set in production to enforce HTTPS-only transmission.
- **No raw token storage** — both passwords and refresh tokens are bcrypt-hashed before database persistence.
- **Validated environment** — `env.schema.ts` uses Zod to parse and validate all environment variables at startup. If a required variable is missing or malformed, the application fails fast with a clear error rather than silently misbehaving at runtime.

> ⚠️ **Production note:** Mounting the host Docker socket grants the worker process root-equivalent access to the host. For production deployments, consider replacing this with a dedicated execution sandbox (gVisor, Firecracker, Kata Containers) or a purpose-built code execution service behind a strict network policy.

---

## Roadmap

- [ ] WebSocket-based real-time output streaming (replace polling)
- [ ] stdin support for interactive programs
- [ ] Per-user resource quotas and rate limiting
- [ ] Problem set management (CRUD, test cases, expected output)
- [ ] Submission history persisted in PostgreSQL
- [ ] Prometheus metrics + Grafana dashboards (queue depth, execution latency, error rates)
- [ ] Email verification flow
- [ ] Kubernetes Helm chart for cloud-native deployment
- [ ] Additional language runtimes: Go, Rust, Java, C/C++, Ruby

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit with conventional commits: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request against `main`

Please open an issue first for major feature changes or architectural proposals.

---

## License

[MIT](LICENSE) © [Saikiran Patil](https://github.com/saikiranpatil)