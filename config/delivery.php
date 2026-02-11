<?php

return [
    'http' => [
        'connect_timeout' => (int) env('DELIVERY_CONNECT_TIMEOUT', 5),
        'timeout' => (int) env('DELIVERY_TIMEOUT', 15),
        'max_attempts' => (int) env('DELIVERY_MAX_ATTEMPTS', 3),
        // Milliseconds for attempts 2..N
        'backoff_ms' => array_values(array_filter(array_map(
            static fn (string $value): int => (int) trim($value),
            explode(',', (string) env('DELIVERY_BACKOFF_MS', '300,1000,3000'))
        ))),
        'retry_on_statuses' => [408, 425, 429, 500, 502, 503, 504],
    ],

    'circuit_breaker' => [
        'enabled' => (bool) env('DELIVERY_CIRCUIT_ENABLED', true),
        'failure_threshold' => (int) env('DELIVERY_CIRCUIT_FAILURE_THRESHOLD', 5),
        'cooldown_seconds' => (int) env('DELIVERY_CIRCUIT_COOLDOWN_SECONDS', 120),
        'rolling_window_seconds' => (int) env('DELIVERY_CIRCUIT_ROLLING_WINDOW_SECONDS', 300),
    ],

    'dlq' => [
        'enabled' => (bool) env('DELIVERY_DLQ_ENABLED', true),
        'max_attempts' => (int) env('DELIVERY_DLQ_MAX_ATTEMPTS', 10),
        'retry_delay_minutes' => (int) env('DELIVERY_DLQ_RETRY_DELAY_MINUTES', 15),
        'batch_size' => (int) env('DELIVERY_DLQ_BATCH_SIZE', 200),
    ],
];
