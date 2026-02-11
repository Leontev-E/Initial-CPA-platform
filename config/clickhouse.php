<?php

return [
    'enabled' => env('CLICKHOUSE_ENABLED', false),

    'host' => env('CLICKHOUSE_HOST', '127.0.0.1'),
    'port' => (int) env('CLICKHOUSE_PORT', 8123),
    'username' => env('CLICKHOUSE_USER', 'default'),
    'password' => env('CLICKHOUSE_PASSWORD', ''),
    'database' => env('CLICKHOUSE_DATABASE', 'analytics'),
    'https' => (bool) env('CLICKHOUSE_HTTPS', false),

    'timeout' => (int) env('CLICKHOUSE_TIMEOUT', 10),
    'connect_timeout' => (int) env('CLICKHOUSE_CONNECT_TIMEOUT', 5),

    'table_lead_events' => env('CLICKHOUSE_TABLE_LEAD_EVENTS', 'lead_events'),
    'retention_months' => (int) env('CLICKHOUSE_RETENTION_MONTHS', 24),

    'buffer' => [
        'redis_connection' => env('CLICKHOUSE_BUFFER_REDIS_CONNECTION', 'default'),
        'redis_key' => env('CLICKHOUSE_BUFFER_REDIS_KEY', 'clickhouse:lead_events:buffer'),
        'batch_size' => (int) env('CLICKHOUSE_BUFFER_BATCH_SIZE', 500),
        'max_flush_items' => (int) env('CLICKHOUSE_BUFFER_MAX_FLUSH_ITEMS', 5000),
    ],
];
