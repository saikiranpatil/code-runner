# ⚡ Code Runner

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-22+-brightgreen.svg)
![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)
![Docker](https://img.shields.io/badge/docker-required-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)
![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)

**A containerized remote code execution platform.**
Submit code, run it in an isolated Docker sandbox, and get back the result — with a Monaco editor UI on the front end.

</div>

---

## Table of Contents

- [Architecture](#architecture)
- [Services](#services)
- [Supported Languages](#supported-languages)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [References](#references)
- [License](#license)

---

## Architecture

```mermaid
flowchart LR
    Browser(["Browser\nReact + Monaco Editor"])

    subgraph COMPOSE["Docker Compose Stack"]
        Nginx["Nginx :80\nReverse Proxy · Static Host"]

        subgraph APP["Application Layer"]
            direction TB
            API["NestJS API :3000\nREST · Auth · Polling"]
            Worker["NestJS Worker\nBullMQ Job Processor"]
        end

        subgraph STORE["Storage Layer"]
            direction TB
            Redis[("Redis 7 Alpine\nBullMQ Job Queue")]
            PG[("PostgreSQL 16 Alpine\nUsers · Submissions")]
        end

        Docker["Docker Host Daemon\nIsolated Sandbox per Submission\nJS · TS · Python · C++ · Java"]
        RI["RedisInsight :5540\nDev Only"]
    end

    Browser -->|"HTTP :80"| Nginx
    Nginx -->|"/ → static bundle"| Browser
    Nginx -->|"/api/* → proxy"| API

    API -->|"enqueue job"| Redis
    API <-->|"read / write"| PG

    Redis -->|"dequeue job"| Worker
    Worker -->|"docker run --rm"| Docker
    Docker -->|"stdout · stderr · exit"| Worker
    Worker -->|"persist results"| PG

    RI -. "inspect" .-> Redis
```

### How It Works

1. **Browser** sends code submissions through **Nginx**, which routes API traffic to the NestJS API and serves the React SPA for all other requests.
2. **NestJS API** authenticates the request, persists submission metadata to **PostgreSQL**, and enqueues a job onto the **Redis** BullMQ queue.
3. **NestJS Worker** (a separate process) dequeues the job, spawns an ephemeral **Docker** container with the appropriate language runtime, captures `stdout`/`stderr`, and writes the verdict back to **PostgreSQL**.
4. The client polls the API for the result using the `jobId` returned at submission time.

> The API server and worker are intentionally decoupled into separate processes so they can be scaled independently.

---

## Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `api` | `node:22-alpine` | `3000` | REST API — auth, job submission, result polling |
| `worker` | `node:22-alpine` | — | Dequeues BullMQ jobs, orchestrates Docker containers |
| `redis` | `redis:7-alpine` | `6379` | BullMQ job queue |
| `postgres` | `postgres:16-alpine` | `5432` | User accounts and submission records |
| `nginx` | `nginx:alpine` | `80` | Reverse proxy and React SPA static file host |
| `redis-insight` | `redislabs/redisinsight:2.54` | `5540` | Redis GUI — dev environment only |

---

## Supported Languages

| Language | Runtime |
|---|---|
| JavaScript | Node.js |
| TypeScript | `ts-node` |
| Python | CPython 3 |
| C++ | `g++` |
| Java | OpenJDK |

---

## Environment Variables

### Backend — `backend/.env`

```env
# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Redis (BullMQ)
REDIS_HOST=redis
REDIS_PORT=6379

# Worker tuning
WORKER_CONCURRENCY=4
WORKER_EXECUTION_TIMEOUT_MS=10000
WORKER_MAX_OUTPUT_BYTES=102400
WORKER_RUN_CONCURRENCY=2
WORKER_SUBMIT_CONCURRENCY=2

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code-runner

# JWT
JWT_SECRET=your-strong-secret
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-strong-refresh-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173

# OAuth — GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# OAuth — Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose v2+**
- **Node.js 22+** (for local development only)

### Run with Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/saikiranpatil/code-runner.git
cd code-runner

# 2. Start all services
docker compose up -d

# 3. Apply database migrations
cd backend
npx prisma migrate deploy

# 4. Pull language Docker images
npx ts-node pull-language-images.ts
```

### Local Development

Run each service in a separate terminal:

```bash
# Terminal 1 — API server
cd backend && npm install && npm run start:dev

# Terminal 2 — BullMQ worker (separate process)
cd backend && npm run worker:dev

# Terminal 3 — Frontend (Vite dev server)
cd frontend && npm install && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| REST API | http://localhost:3000 |
| Swagger docs | http://localhost:3000/api |
| RedisInsight | http://localhost:5540 |

---

## API Reference

All responses use a consistent envelope format:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { }
}
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a new account |
| `POST` | `/auth/login` | Public | Email / password login |
| `POST` | `/auth/logout` | JWT | Invalidate the refresh token |
| `POST` | `/auth/refresh` | Cookie | Rotate the access / refresh token pair |
| `GET` | `/auth/github` | Public | Initiate GitHub OAuth flow |
| `GET` | `/auth/google` | Public | Initiate Google OAuth flow |

### Code Execution

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/execute/run` | JWT | Run code against example test cases |
| `GET` | `/execute/run/:jobId` | JWT | Poll run job result |
| `POST` | `/execute/submit` | JWT | Submit code against all (including hidden) test cases |
| `GET` | `/execute/submit/:jobId` | JWT | Poll submission result |

---

## Database Schema

```
User
  id               UUID  PK
  email            String  unique
  passwordHash     String?
  refreshTokenHash String?
  avatarUrl        String?

Problem
  id               UUID  PK
  slug             String  unique
  title            String
  description      String
  difficulty       Enum (EASY | MEDIUM | HARD)
  visibility       Enum (PUBLIC | PRIVATE)
  examples         Json

TestCase
  id               UUID  PK
  problemId        UUID  FK → Problem
  input            String
  expectedOutput   String
  isHidden         Boolean
  position         Int

Submission
  id               UUID  PK
  problemId        UUID  FK → Problem
  userId           UUID  FK → User
  language         String
  sourceCode       String
  verdict          Enum
  passedCount      Int

TestCaseResult
  id               UUID  PK
  submissionId     UUID  FK → Submission
  testCaseId       UUID  FK → TestCase
  verdict          Enum
  stdout           String?
  stderr           String?
```

---

## References

### Backend

| Topic | Resource |
|---|---|
| NestJS + Prisma setup | [NestJS Prisma REST API](https://www.prisma.io/blog/nestjs-prisma-rest-api-7D056s1BmOL0) |
| Standalone BullMQ worker | [NestJS Standalone BullMQ Worker](https://medium.com/@omarae00/nestjs-standalone-bullmq-worker-6f44faefaf6b) |
| Queue patterns | [BullMQ with NestJS](https://mahabub-r.medium.com/using-bullmq-with-nestjs-for-background-job-processing-320ab938048a) |
| Container spawning | [Node.js `child_process`](https://medium.com/the-guild/getting-to-know-nodes-child-process-module-8ed63038f3fa) |
| Validation & error handling | [NestJS Best Practices](https://devkamal.medium.com/validation-error-handling-in-nestjs-best-practices-9444184cceae) |
| Graceful shutdown | [NestJS `OnApplicationShutdown`](https://dev.to/hienngm/graceful-shutdown-in-nestjs-ensuring-smooth-application-termination-4e5n) |
| Structured logging | [nestjs-pino](https://www.tomray.dev/nestjs-logging) |
| JWT + refresh tokens | [JWT Auth with Refresh Tokens](https://njihiamark.medium.com/mastering-jwt-authentication-with-refresh-tokens-in-nestjs-react-google-email-auth-e4f1e8c8c21e) |

### Frontend

| Topic | Resource |
|---|---|
| Auth store (JWT + Zustand + TanStack Query) | [Production-Grade React Auth](https://dev.to/hkarimi/building-a-production-grade-react-auth-starter-jwt-refresh-tokens-zustand-tanstack-query-3pk3) |
| Typed API layer | [ohcnetwork/care_fe request utilities](https://github.com/ohcnetwork/care_fe/blob/develop/src/Utils/request/README.md) |
| OAuth via popup | [window.open + postMessage](https://stackoverflow.com/questions/7606071/how-can-i-do-oauth-request-by-open-new-window-instead-of-redirect-user-from-cur) |

### Similar Projects

- [Mahboob-A/rcee](https://github.com/Mahboob-A/rcee) — Remote code execution engine with Docker isolation, part of the Algocode project

---

## License

[MIT](LICENSE) © [Saikiran Patil](https://github.com/saikiranpatil)