# Operations: Performance + Stability

## 1. Queue stack: Redis + Horizon

Default runtime is now Redis-backed queueing:

```bash
QUEUE_CONNECTION=redis
CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_CLIENT=predis
```

Run workers via Horizon:

```bash
php artisan horizon
```

Useful Horizon commands:

```bash
php artisan horizon:status
php artisan horizon:supervisors
php artisan horizon:terminate
```

## 2. Idempotent lead intake

Leads API now supports idempotency (automatic and explicit):

- explicit: request field `idempotency_key` or header `Idempotency-Key`
- automatic fallback: `subid` / selected `tags` keys (`click_id`, `external_click_id`, `sub1`, ...)

DB-level dedupe is enforced by unique index:

`(partner_program_id, webmaster_id, offer_id, idempotency_key)`

On duplicate submission API returns existing `lead_id` with:

```json
{
  "status": "ok",
  "lead_id": 123,
  "duplicate": true
}
```

## 3. Outbound delivery hardening (postbacks/webhooks)

Added centralized delivery layer with:

- retry + backoff
- timeout/connect-timeout
- circuit breaker per destination URL
- dead-letter queue table `delivery_dead_letters`

Relevant env:

```bash
DELIVERY_CONNECT_TIMEOUT=5
DELIVERY_TIMEOUT=15
DELIVERY_MAX_ATTEMPTS=3
DELIVERY_BACKOFF_MS=300,1000,3000
DELIVERY_CIRCUIT_ENABLED=true
DELIVERY_CIRCUIT_FAILURE_THRESHOLD=5
DELIVERY_CIRCUIT_COOLDOWN_SECONDS=120
DELIVERY_CIRCUIT_ROLLING_WINDOW_SECONDS=300
DELIVERY_DLQ_ENABLED=true
DELIVERY_DLQ_MAX_ATTEMPTS=10
DELIVERY_DLQ_RETRY_DELAY_MINUTES=15
DELIVERY_DLQ_BATCH_SIZE=200
```

DLQ retry command:

```bash
php artisan delivery:retry-dead-letters
```

Scheduled automatically every 5 minutes.

## 4. PostgreSQL + PgBouncer

PostgreSQL remains primary transactional DB.
Default app connection is direct to Postgres:

```bash
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
```

`docker-compose.yml` includes optional PgBouncer service (`pgbouncer`) for connection pooling.
If you switch app traffic to PgBouncer in Docker network, use:

```bash
DB_HOST=pgbouncer
DB_PORT=5432
```

Added high-volume indexes for `leads` to speed dashboard/report filters.

## 5. ClickHouse batched ingestion

Lead analytics events are buffered in Redis and flushed in batches to ClickHouse:

```bash
php artisan clickhouse:flush-lead-events
```

Relevant env:

```bash
CLICKHOUSE_ENABLED=true
CLICKHOUSE_BUFFER_REDIS_CONNECTION=default
CLICKHOUSE_BUFFER_REDIS_KEY=clickhouse:lead_events:buffer
CLICKHOUSE_BUFFER_BATCH_SIZE=500
CLICKHOUSE_BUFFER_MAX_FLUSH_ITEMS=5000
```

Scheduled automatically every minute when ClickHouse is enabled.

## 6. Health and readiness probes

Endpoints:

- `GET /api/health/live` - liveness
- `GET /api/health/ready` - readiness (DB, cache, Redis, ClickHouse)

Use these in load balancer / deployment checks.

## 7. GEOIP DB3 Lite auto-update

Command:

```bash
php artisan geoip:update-db3-lite
```

Scheduler runs daily (`GEOIP_AUTO_UPDATE_DAILY_AT`, default `03:20`).
