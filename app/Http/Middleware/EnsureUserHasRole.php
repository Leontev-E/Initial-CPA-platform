<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, __('Доступ запрещен'));
        }

        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return $next($request);
        }

        $normalizedRole = $user->role === 'partner_admin' ? 'admin' : $user->role;

        if (empty($roles) || !in_array($normalizedRole, $roles, true)) {
            abort(403, __('Доступ запрещен'));
        }

        return $next($request);
    }
}
