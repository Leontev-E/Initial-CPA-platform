# Operations: GEOIP + PostgreSQL + ClickHouse

## 1. GEOIP DB3 Lite auto-update

Command:

```bash
php artisan geoip:update-db3-lite
```

Scheduler is enabled in `bootstrap/app.php` and runs daily (default `03:20` from `GEOIP_AUTO_UPDATE_DAILY_AT`).

Required server cron (once):

```bash
* * * * * cd /opt/cpa-boostclicks && php artisan schedule:run >> /var/log/cpa-scheduler.log 2>&1
```

Relevant env:

```bash
GEOIP_ENABLED=true
IP2LOCATION_DB_PATH=storage/app/ip2location/IP2LOCATION-LITE-DB3.BIN
GEOIP_AUTO_UPDATE_ENABLED=true
GEOIP_AUTO_UPDATE_URL=https://download.ip2location.com/lite/IP2LOCATION-LITE-DB3.BIN.ZIP
GEOIP_AUTO_UPDATE_DAILY_AT=03:20
GEOIP_AUTO_UPDATE_CONNECT_TIMEOUT=10
GEOIP_AUTO_UPDATE_TIMEOUT=180
```

## 2. PostgreSQL default

Project defaults to PostgreSQL in `.env.example`:

```bash
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=cpa_db
DB_USERNAME=cpa_user
DB_PASSWORD=change_me_db_password
DB_SCHEMA=public
```

## 3. ClickHouse analytics

Setup schema:

```bash
php artisan clickhouse:setup
```

Lead events are asynchronously replicated into ClickHouse via queue job `SyncLeadEventToClickHouseJob`.
Events: `created`, `status_changed`.

Relevant env:

```bash
CLICKHOUSE_ENABLED=false
CLICKHOUSE_HOST=127.0.0.1
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=analytics
CLICKHOUSE_HTTPS=false
CLICKHOUSE_TIMEOUT=10
CLICKHOUSE_CONNECT_TIMEOUT=5
CLICKHOUSE_TABLE_LEAD_EVENTS=lead_events
CLICKHOUSE_RETENTION_MONTHS=24
```
