# ⚡ Code Runner

> A scalable, containerized remote code execution engine with job queue architecture.

[![JavaScript](https://img.shields.io/badge/JavaScript-94.9%25-F7DF1E?logo=javascript&logoColor=black)](https://github.com/saikiranpatil/code-runner)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://github.com/saikiranpatil/code-runner)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

Code Runner is a distributed system that safely executes user-submitted code in isolated Docker containers. It decouples code submission from execution using a Redis-backed job queue, enabling high throughput and horizontal scalability.

**Key design goals:**
- **Isolation** — each submission runs in a fresh, sandboxed container on the host Docker daemon
- **Scalability** — multiple Express server replicas sit behind an Nginx load balancer
- **Reliability** — job queue persists submissions; workers process them asynchronously

---

## Architecture

```
Client
  │
  ▼
Nginx (port 80)           ← reverse proxy + load balancer
  │
  ├─▶ Express Server ×3   ← REST API, pushes jobs to Redis queue
  │
Redis Queue               ← persistent job store
  │
  └─▶ Worker              ← dequeues jobs, spawns Docker containers
          │
          ▼
      Docker (host daemon) ← sandboxed execution per submission
```

### Services

| Service | Description |
|---|---|
| **nginx** | Reverse proxy exposing port 80; load-balances across server replicas |
| **server** | Node.js/Express API (3 replicas); accepts code submissions, enqueues jobs |
| **worker** | Dequeues jobs from Redis; spins up isolated Docker containers via host socket |
| **redis** | Job queue and result store (Redis 7 Alpine) |
| **redis-insight** | Web UI for Redis inspection at port 5540 |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2+
- Git

### Installation

```bash
git clone https://github.com/saikiranpatil/code-runner.git
cd code-runner
docker compose up --build
```

- API: `http://localhost`
- Redis Insight: `http://localhost:5540`

### Stopping

```bash
docker compose down        # stop containers
docker compose down -v     # stop + remove volumes
```

---

## Usage

### Submit Code

```bash
curl -X POST http://localhost/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, World!\")"
  }'
```

### Poll Result

```bash
curl http://localhost/result/<job-id>
```

---

## Configuration

| Variable | Service | Default | Description |
|---|---|---|---|
| `REDIS_HOST` | server, worker | `redis` | Redis service hostname |

Nginx config is mounted from `./nginx/nginx.conf`.

---

## Project Structure

```
code-runner/
├── nginx/
│   └── nginx.conf          # Reverse proxy + load balancer config
├── server/
│   ├── Dockerfile
│   └── index.js            # Express API — receives and enqueues jobs
├── worker/
│   ├── Dockerfile
│   └── index.js            # Dequeues jobs, runs isolated Docker containers
└── docker-compose.yml      # Full service orchestration
```

---

## Security

- Worker mounts `/var/run/docker.sock` to talk to the **host** Docker daemon — execution containers run on the host, not nested inside the worker (no Docker-in-Docker).
- Only **Nginx** is exposed to the host network; all internal services communicate over an isolated `redis-network` bridge.
- Each submission runs in a **fresh, ephemeral container**, preventing state leakage between executions.

> ⚠️ **Production note:** Host Docker socket access is a privileged operation. In production, consider using a dedicated execution sandbox (gVisor, Firecracker, or a restricted Docker profile) behind a firewall.

---

## Roadmap

- [ ] **More languages** — Java, C/C++, Go, Rust, Ruby runtime images
- [ ] **Resource limits** — CPU, memory, and execution time caps per container
- [ ] **stdin support** — pass standard input to submitted programs
- [ ] **WebSocket results** — push execution output in real time instead of polling
- [ ] **Auth & rate limiting** — API keys or JWT to prevent abuse
- [ ] **Observability** — Prometheus + Grafana for queue depth, execution time, error rates
- [ ] **Persistent job history** — store submissions and results in PostgreSQL
- [ ] **Multi-tenancy** — per-user namespaces and usage quotas
- [ ] **CI/CD pipeline** — GitHub Actions for automated testing and image publishing
- [ ] **Kubernetes / Helm chart** — cloud-native scaling

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

Open an issue first for major changes.

---

## License

[MIT](LICENSE) © [Saikiran Patil](https://github.com/saikiranpatil)