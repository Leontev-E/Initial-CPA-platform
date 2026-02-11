<?php

namespace App\Services\Geo;

use App\Contracts\GeoIpResolver;

class NullGeoIpResolver implements GeoIpResolver
{
    public function resolveCountryCode(?string $ip): ?string
    {
        return null;
    }
}
