<?php

namespace App\Providers;

use App\Contracts\GeoIpResolver;
use App\Services\Analytics\ClickHouseLeadEvents;
use App\Services\Geo\Ip2LocationGeoIpResolver;
use App\Services\Geo\NullGeoIpResolver;
use App\Support\PartnerProgramContext;
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

            if (! class_exists(Database::class)) {
                return new NullGeoIpResolver();
            }

            return new Ip2LocationGeoIpResolver();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        URL::forceScheme("https");
        Vite::prefetch(concurrency: 3);
    }
}
