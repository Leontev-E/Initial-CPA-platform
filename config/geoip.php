<?php

return [
    'enabled' => env('GEOIP_ENABLED', true),

    // If true and GEO from IP is available, it overrides webmaster-provided GEO.
    'prefer_detected_geo' => env('GEOIP_PREFER_DETECTED_GEO', false),

    // Add detected/submitted GEO metadata into lead.extra_data.
    'attach_detected_geo_to_extra_data' => env('GEOIP_ATTACH_DETECTED_GEO_TO_EXTRA_DATA', true),

    'ip2location' => [
        'database_path' => env('IP2LOCATION_DB_PATH', storage_path('app/ip2location/IP2LOCATION-LITE-DB3.BIN')),
        'mode' => env('IP2LOCATION_MODE', 'FILE_IO'),
    ],

    'auto_update' => [
        'enabled' => env('GEOIP_AUTO_UPDATE_ENABLED', true),
        'url' => env('GEOIP_AUTO_UPDATE_URL', 'https://download.ip2location.com/lite/IP2LOCATION-LITE-DB3.BIN.ZIP'),
        'daily_at' => env('GEOIP_AUTO_UPDATE_DAILY_AT', '03:20'),
        'connect_timeout' => (int) env('GEOIP_AUTO_UPDATE_CONNECT_TIMEOUT', 10),
        'timeout' => (int) env('GEOIP_AUTO_UPDATE_TIMEOUT', 180),
    ],
];
