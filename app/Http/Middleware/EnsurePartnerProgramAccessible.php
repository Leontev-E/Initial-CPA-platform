<?php

namespace App\Http\Middleware;

use App\Support\PartnerProgramContext;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsurePartnerProgramAccessible
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return $next($request);
        }

        $program = app(PartnerProgramContext::class)->getPartnerProgram();

        if ($program && $program->is_blocked) {
            return Inertia::render('BlockedProgram', [
                'program' => $program->only(['id', 'name', 'slug']),
            ])->toResponse($request)->setStatusCode(403);
        }

        return $next($request);
    }
}
