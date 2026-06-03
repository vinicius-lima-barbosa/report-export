# Report Export Service

## Introduction

Report Export Service is a Node.js (TypeScript) API that generates reports asynchronously and delivers a download link when finished. It uses a background queue for processing, PostgreSQL for persistence, Redis for queueing and pub/sub, and Supabase Storage for file delivery. Clients can track progress in real time over WebSocket.

## How It Works

1. Client requests a report with filters.
2. API creates a report record in PostgreSQL with `PENDING` status.
3. A BullMQ job is enqueued in Redis.
4. A worker processes the job, updates progress in PostgreSQL, and publishes progress to Redis pub/sub.
5. The WebSocket server forwards progress updates to subscribed clients.
6. The worker uploads the final CSV to Supabase Storage and marks the report `COMPLETED`.
7. Client requests a signed download URL.

### High-Level Flow

```
Client -> REST API -> PostgreSQL
								 -> Redis Queue -> Worker -> Supabase Storage
								 -> Redis Pub/Sub -> WebSocket -> Client
```

## API Endpoints

Base URL: `http://localhost:3000`

### Health

```
GET /health
```

### List Reports

```
GET /reports
```

### Create Report

```
POST /reports
Content-Type: application/json

{
	"startDate": "2026-05-01",
	"endDate": "2026-05-31",
	"category": "sales"
}
```

### Download Report

```
POST /reports/:id/download
```

## WebSocket Updates

Connect to the same server (default: `ws://localhost:3000`) and subscribe to a report:

```
{
	"type": "SUBSCRIBE_REPORT",
	"reportId": "<report-id>"
}
```

Progress messages:

```
{
	"type": "REPORT_PROGRESS",
	"status": "PROCESSING",
	"progress": 40
}
```

## How To Run

### 1) Install dependencies

```
pnpm install
```

### 2) Start infrastructure (PostgreSQL + Redis)

```
docker compose up -d
```

### 3) Configure environment variables

Create a `.env` file at the project root (see Env section below).

### 4) Initialize the database

Run the SQL in `migrations/reports_db.sql` against your Postgres instance.

### 5) Start the API

```
pnpm dev
```

The server listens on `http://localhost:3000` by default.

## Env Environments

The service loads configuration from `.env`:

| Variable                  | Description                 | Default          |
| ------------------------- | --------------------------- | ---------------- |
| NODE_ENV                  | Runtime environment         | development      |
| PORT                      | HTTP server port            | 3000             |
| CORS_ORIGIN               | Comma-separated list or `*` | \*               |
| REDIS_HOST                | Redis host                  | localhost        |
| REDIS_PORT                | Redis port                  | 6379             |
| DB_USER                   | Postgres user               | postgres         |
| DB_HOST                   | Postgres host               | localhost        |
| DB_NAME                   | Postgres database           | report_export_db |
| DB_PASSWORD               | Postgres password           | postgres         |
| DB_PORT                   | Postgres port               | 5432             |
| SUPABASE_URL              | Supabase project URL        | (required)       |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key   | (required)       |

## Version

Current package version: **1.2.3**

## Possible Updates

- Replace fake user IDs with real auth integration.
- Store more report metadata (filters, file size, mime type).
- Add pagination and filtering to the list endpoint.
- Emit a signed download URL directly in the WebSocket completion event.
- Add OpenAPI/Swagger documentation.

## Notes

- The worker generates a CSV file (semicolon-delimited) and uploads to a `reports` bucket in Supabase Storage.
- Redis Insight runs on `http://localhost:5540` when using Docker Compose.
