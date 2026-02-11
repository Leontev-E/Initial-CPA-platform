<?php

namespace App\Providers;

use App\Contracts\GeoIpResolver;
use App\Services\Analytics\ClickHouseLeadEvents;
use App\Services\Geo\ChainGeoIpResolver;
use App\Services\Geo\HttpGeoIpResolver;
use App\Services\Geo\Ip2LocationGeoIpResolver;
use App\Services\Geo\NullGeoIpResolver;
use App\Support\PartnerProgramContext;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use IP2Location\Database;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PartnerProgramContext::class, fn () => new PartnerProgramContext());
        $this->app->singleton(ClickHouseLeadEvents::class, fn () => new ClickHouseLeadEvents());
        $this->app->singleton(GeoIpResolver::class, function () {
            if (! (bool) config('geoip.enabled', false)) {
                return new NullGeoIpResolver();
            }

            $resolvers = [];

            if (class_exists(Database::class)) {
                $resolvers[] = new Ip2LocationGeoIpResolver();
            }

            if ((bool) config('geoip.http_fallback.enabled', true)) {
                $resolvers[] = new HttpGeoIpResolver();
            }

            if ($resolvers === []) {
                return new NullGeoIpResolver();
            }

            if (count($resolvers) === 1) {
                return $resolvers[0];
            }

            return new ChainGeoIpResolver($resolvers);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        URL::forceScheme("https");
        Vite::prefetch(concurrency: 3);

        $this->registerRateLimits();
        $this->registerSlowQueryLogging();
    }

    private function registerRateLimits(): void
    {
        RateLimiter::for('api-leads', function (Request $request): array {
            $apiKey = (string) $request->header('X-API-KEY', 'guest');
            $bucket = sha1($apiKey.'|'.$request->ip());

            return [
                Limit::perMinute((int) config('performance.api_leads_per_minute', 600))->by($bucket),
            ];
        });
    }

    private function registerSlowQueryLogging(): void
    {
        $threshold = (int) config('performance.slow_query_ms', 500);
        if ($threshold < 1) {
            return;
        }

        DB::whenQueryingForLongerThan($threshold, function ($connection, QueryExecuted $event) use ($threshold): void {
            Log::warning('Slow query detected', [
                'threshold_ms' => $threshold,
                'connection' => $connection->getName(),
                'time_ms' => $event->time,
                'sql' => $event->toRawSql(),
            ]);
        });
    }
}
