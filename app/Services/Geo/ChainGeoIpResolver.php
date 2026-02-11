<?php

namespace App\Services\Geo;

use App\Contracts\GeoIpResolver;

class ChainGeoIpResolver implements GeoIpResolver
{
    /**
     * @param array<int, GeoIpResolver> $resolvers
     */
    public function __construct(private readonly array $resolvers)
    {
    }

    public function resolveCountryCode(?string $ip): ?string
    {
        foreach ($this->resolvers as $resolver) {
            $countryCode = $resolver->resolveCountryCode($ip);
            if (is_string($countryCode) && preg_match('/^[A-Z]{2}$/', $countryCode) === 1) {
                return $countryCode;
            }
        }

        return null;
    }
}

