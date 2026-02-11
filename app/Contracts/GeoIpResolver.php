<?php

namespace App\Contracts;

interface GeoIpResolver
{
    public function resolveCountryCode(?string $ip): ?string;
}
