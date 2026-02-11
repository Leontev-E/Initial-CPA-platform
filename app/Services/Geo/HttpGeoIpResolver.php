<?php

namespace App\Services\Geo;

use App\Contracts\GeoIpResolver;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class HttpGeoIpResolver implements GeoIpResolver
{
    public function resolveCountryCode(?string $ip): ?string
    {
        if (! is_string($ip) || $ip === '' || ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return null;
        }

        $cacheKey = 'geoip:http:'.sha1($ip);
        $cacheTtl = max((int) config('geoip.http_fallback.cache_ttl_seconds', 86400), 0);

        if ($cacheTtl > 0) {
            return Cache::remember($cacheKey, $cacheTtl, fn () => $this->lookup($ip));
        }

        return $this->lookup($ip);
    }

    private function lookup(string $ip): ?string
    {
        $urlTemplate = trim((string) config('geoip.http_fallback.url', 'https://ipwho.is/{ip}'));
        if ($urlTemplate === '') {
            return null;
        }

        $url = str_replace('{ip}', rawurlencode($ip), $urlTemplate);

        try {
            $response = Http::connectTimeout((int) config('geoip.http_fallback.connect_timeout', 2))
                ->timeout((int) config('geoip.http_fallback.timeout', 3))
                ->acceptJson()
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $payload = $response->json();
            if (! is_array($payload)) {
                return null;
            }

            if (array_key_exists('success', $payload) && $payload['success'] === false) {
                return null;
            }

            $countryCode = (string) ($payload['country_code'] ?? $payload['countryCode'] ?? '');
            $countryCode = strtoupper(trim($countryCode));

            return preg_match('/^[A-Z]{2}$/', $countryCode) === 1 ? $countryCode : null;
        } catch (Throwable $exception) {
            Log::warning('HTTP GeoIP lookup failed', [
                'ip' => $ip,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}

