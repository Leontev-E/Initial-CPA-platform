<?php

use Illuminate\Foundation\Application;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands()
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\UpdateLastActivity::class,
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\SetPartnerProgramContext::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\UpdateLastActivity::class,
            \App\Http\Middleware\SetPartnerProgramContext::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'section.access' => \App\Http\Middleware\EnsureSectionAccess::class,
            'partner_program.access' => \App\Http\Middleware\EnsurePartnerProgramAccessible::class,
        ]);
        $middleware->trustProxies(at: "*", headers: \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_FOR | \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_HOST | \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_PROTO | \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_PORT | \Symfony\Component\HttpFoundation\Request::HEADER_X_FORWARDED_PREFIX);

    })
    ->withSchedule(function (Schedule $schedule): void {
        if ((bool) config('geoip.auto_update.enabled', true)) {
            $schedule->command('geoip:update-db3-lite')
                ->dailyAt((string) config('geoip.auto_update.daily_at', '03:20'))
                ->withoutOverlapping();
        }
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
