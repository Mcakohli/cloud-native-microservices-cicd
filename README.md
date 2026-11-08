# Cloud-Native Microservices Deployment & CI/CD Pipeline

A production-grade, containerized full-stack microservices architecture deployed on AWS EC2, orchestrated using Docker Compose, and automated with GitHub Actions continuous integration and continuous deployment (CI/CD).

---

## 1. Live Deployment & Important Links

- **Deployed Application URL:** [http://13.235.79.188](http://13.235.79.188)
- **Health Check API:** [http://13.235.79.188/api/health](http://13.235.79.188/api/health)
- **Job Submission API:** `POST http://13.235.79.188/api/jobs/submit`
- **GitHub Repository:** [https://github.com/Mcakohli/cloud-native-microservices-cicd](https://github.com/Mcakohli/cloud-native-microservices-cicd)
- **Walkthrough Video:** `<INSERT_YOUR_VIDEO_LINK_HERE>`

---

## 2. Architecture Overview

The system is decoupled into isolated, single-responsibility services running inside a shared Docker bridge network on an AWS EC2 instance (`ap-south-1`).

                 ┌────────────────────────────────────────┐
                 │          Client / Web Browser          │
                 └───────────────────┬────────────────────┘
                                     │ Port 80 (HTTP)
                                     ▼
                 ┌────────────────────────────────────────┐
                 │          Nginx Reverse Proxy           │
                 └──────────┬──────────────────┬──────────┘
         /api/              │                  │  /
         (rewrite /$1)      ▼                  ▼
  ┌─────────────────────────────┐  ┌───────────────────────┐
  │     NestJS API (Port 3001)  │  │   Next.js (Port 3000) │
  └──────────────┬──────────────┘  └───────────────────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│    PostgreSQL    │  │   Redis (Queue)  │
└──────────────────┘  └────────┬─────────┘
│ BullMQ Job Stream
▼
┌──────────────────┐
│  BullMQ Worker   │
└──────────────────┘


### Component Breakdown
| Service | Technology | Responsibility | Internal Port |
| :--- | :--- | :--- | :--- |
| **Reverse Proxy** | Nginx | Ingress traffic management, SSL/HTTP handling, `/api/` path rewrites | `80` (public) |
| **Frontend** | Next.js 14 | Responsive UI for job submission and status monitoring | `3000` |
| **Backend API** | NestJS | REST API routing, input validation, and job dispatching | `3001` |
| **Queue / Cache** | Redis 7 | In-memory message broker for BullMQ job queue | `6379` |
| **Background Worker** | Node.js / BullMQ | Dequeues and asynchronously executes background compute tasks | N/A |
| **Database** | PostgreSQL 16 | Relational data persistence with persistent volume binding | `5432` |

---

## 3. Asynchronous Task Workflow (Redis + BullMQ)

1. **Submission:** A client sends a task request via the web UI or via `POST /api/jobs/submit`.
2. **Ingestion & Validation:** Nginx strips the `/api/` prefix and forwards the request to the NestJS backend (`/jobs/submit`).
3. **Queue Enqueuing:** The backend pushes the task payload into the Redis `task-queue` using BullMQ and immediately responds with `HTTP 201 Created` (`{"jobId":"1","taskName":"Default Task","status":"QUEUED"}`).
4. **Asynchronous Execution:** The dedicated BullMQ worker container listening to Redis pops the task from the queue, processes it, and marks it completed without blocking the main REST API thread.

---

## 4. Local Development Setup

To run the entire application stack locally with a single command:

### Prerequisites
- Docker Engine (v24+) & Docker Compose (v2+)
- Git

### 1. Clone the Repository
```bash
git clone [https://github.com/Mcakohli/cloud-native-microservices-cicd.git](https://github.com/Mcakohli/cloud-native-microservices-cicd.git)
cd cloud-native-microservices-cicd
2. Configure Environment Variables
Create a root .env file (or use defaults):

Code snippet
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=microservices_db
DATABASE_URL=postgresql://postgres:postgres_password@postgres:5432/microservices_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Application Ports
BACKEND_PORT=3001
FRONTEND_PORT=3000
3. Start the Stack
Bash
docker compose up -d --build
4. Verify Local Execution
Frontend: http://localhost:3000

Backend Health: http://localhost:3001/health

View Logs: docker compose logs -f

5. CI/CD Pipeline Implementation
The automated pipeline is implemented using GitHub Actions (.github/workflows/deploy.yml):

Trigger: Automatically initiates upon push to the main branch.

Code Quality & Build Checks: Lints the codebase and verifies dependencies across services.

Multi-Stage Container Builds: Builds minimal, hardened Docker images for frontend, backend, and worker.

Registry Publishing: Tags images with the Git commit SHA (and latest) and pushes them to GitHub Container Registry (GHCR).

Continuous Deployment to Cloud: Connects to the AWS EC2 instance via SSH, fetches updated manifests, authenticates against GHCR, pulls newly built images, and executes zero-downtime container recreation (docker compose up -d --force-recreate).

6. Production Reliability & Operational Best Practices
A. Secret Management
Zero hardcoded credentials in version control.

Sensitive environment variables (POSTGRES_PASSWORD, SSH_PRIVATE_KEY, GHCR_PAT) are injected securely at runtime via GitHub Actions Secrets and encrypted host-level environment configuration.

B. Data Persistence
PostgreSQL database data is stored using named Docker volumes (postgres_data:/var/lib/postgresql/data).

Volume lifecycles are decoupled from container lifecycles, ensuring zero data loss during container recreation, host reboots, or updates.

C. Application Crash Resilience & Health Checks
All containers are configured with restart: unless-stopped to automatically recover from unhandled runtime exceptions.

Container-level Docker healthcheck directives monitor internal TCP/HTTP socket responsiveness before downstream services can route traffic to them.

D. Container Investigation & Troubleshooting
When diagnosing failing services:

Bash
# 1. Check container lifecycle states
docker compose ps

# 2. Inspect real-time logs with timestamps
docker compose logs -f --tail=100 <service_name>

# 3. Inspect container exit codes and low-level details
docker inspect <container_id>

# 4. Enter the container shell for connectivity tests
docker exec -it <service_name> sh
E. Deployment Rollback Strategy
If an issue escapes automated CI/CD checks:

Automated Rollback via Git: Revert the offending commit on main (git revert HEAD && git push origin main), triggering the pipeline to re-deploy the prior stable build.

Immediate Manual Rollback: On the EC2 host, update docker-compose.prod.yml to target the previous image commit SHA tag and run docker compose up -d.

7. Verification Proof
Backend Health Check
Bash
$ curl -i http://localhost/api/health
HTTP/1.1 200 OK
Server: nginx/1.31.8
Content-Type: application/json; charset=utf-8

{"status":"UP","timestamp":"2026-11-08T03:46:59.796Z","service":"vegah-backend"}
Job Enqueueing & Worker Completion
Bash
$ curl -i -X POST http://localhost/api/jobs/submit \
  -H "Content-Type: application/json" \
  -d '{"title": "Production Job Assessment"}'

HTTP/1.1 201 Created
{"jobId":"2","taskName":"Default Task","status":"QUEUED"}
Worker Processing Logs:

Plaintext
vegah-worker  | [Worker] Connecting to Redis at redis:6379...
vegah-worker  | [Worker] Worker service ready and listening for jobs.
vegah-worker  | [Worker] Processing Job ID: 2 - Task: "Default Task"
vegah-worker  | [Worker] Completed Job ID: 2

---

### How to Update and Push to GitHub

In your local project terminal (`C:\Users\rkkor\Desktop\cloud-engineering\cloud-native-microservices-cicd`)[cite: 5, 9]:

```powershell
# 1. Open and replace the content of README.md with the text above
# 2. Stage, commit, and push
git add README.md
git commit -m "docs: add comprehensive architecture, deployment, and reliability guide to README"
git push origin main
