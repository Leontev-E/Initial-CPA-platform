<?php

return [
    'slow_query_ms' => (int) env('SLOW_QUERY_THRESHOLD_MS', 500),
    'api_leads_per_minute' => (int) env('API_LEADS_RATE_LIMIT_PER_MINUTE', 600),
];
