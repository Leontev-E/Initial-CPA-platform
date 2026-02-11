<?php

namespace App\Services\Geo;

use App\Contracts\GeoIpResolver;
use IP2Location\Database;
use Illuminate\Support\Facades\Log;
use Throwable;

class Ip2LocationGeoIpResolver implements GeoIpResolver
{
    private ?Database $database = null;

    private bool $disabled = false;

    public function resolveCountryCode(?string $ip): ?string
    {
        if (! is_string($ip) || $ip === '' || ! filter_var($ip, FILTER_VALIDATE_IP)) {
            return null;
        }

        $database = $this->database();
        if (! $database) {
            return null;
        }

        try {
            $countryCode = $database->lookup($ip, Database::COUNTRY_CODE);
        } catch (Throwable $exception) {
            Log::warning('IP2Location lookup failed', [
                'ip' => $ip,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }

        if (! is_string($countryCode)) {
            return null;
        }

        $countryCode = strtoupper(trim($countryCode));

        return preg_match('/^[A-Z]{2}$/', $countryCode) === 1 ? $countryCode : null;
    }

    private function database(): ?Database
    {
        if ($this->disabled) {
            return null;
        }

        if ($this->database) {
            return $this->database;
        }

        $path = (string) config('geoip.ip2location.database_path');
        if ($path === '' || ! is_file($path) || ! is_readable($path)) {
            $this->disabled = true;

            Log::warning('IP2Location DB file is missing or unreadable', [
                'path' => $path,
            ]);

            return null;
        }

        $mode = match (strtoupper((string) config('geoip.ip2location.mode', 'FILE_IO'))) {
            'MEMORY_CACHE' => Database::MEMORY_CACHE,
            'SHARED_MEMORY' => Database::SHARED_MEMORY,
            default => Database::FILE_IO,
        };

        try {
            $this->database = new Database($path, $mode);
        } catch (Throwable $exception) {
            $this->disabled = true;

            Log::warning('IP2Location DB initialization failed', [
                'path' => $path,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }

        return $this->database;
    }
}
