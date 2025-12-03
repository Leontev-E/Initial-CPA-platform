<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureSectionAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        // Основному админу разрешено всё
        if ($user->invited_by === null) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();
        if (! $routeName) {
            return $next($request);
        }

        $sectionMap = [
            'admin.offer-categories' => 'categories',
            'admin.offers' => 'offers',
            'admin.leads' => 'leads',
            'admin.webmasters' => 'webmasters',
            'admin.payouts' => 'payouts',
            'admin.reports' => 'reports',
            'admin.dashboard' => null, // всегда доступен
        ];

        $section = null;
        foreach ($sectionMap as $prefix => $value) {
            if (Str::startsWith($routeName, $prefix)) {
                $section = $value;
                break;
            }
        }

        // Если секция не мапится - пропускаем
        if ($section === null && $routeName !== 'admin.dashboard') {
            return $next($request);
        }

        $permissions = $user->permissions ?? [];
        $sections = Arr::get($permissions, 'sections', []);

        if ($section && ! in_array($section, $sections, true)) {
            abort(403);
        }

        $actions = Arr::get($permissions, 'actions', []);
        $method = $request->method();

        if (in_array($method, ['POST'], true) && empty($actions['create'])) {
            abort(403);
        }

        if (in_array($method, ['PUT', 'PATCH'], true) && empty($actions['update'])) {
            abort(403);
        }

        if ($method === 'DELETE' && empty($actions['delete'])) {
            abort(403);
        }

        return $next($request);
    }
}
