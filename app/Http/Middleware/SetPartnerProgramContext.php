<?php

namespace App\Http\Middleware;

use App\Models\PartnerProgram;
use App\Support\PartnerProgramContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetPartnerProgramContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $context = app(PartnerProgramContext::class);
        $user = $request->user();

        if ($user) {
            $contextId = $user->partner_program_id;

            if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
                $contextId = $request->session()->get('partner_program_id');
            }

            $context->setPartnerProgramId($contextId);
        } elseif ($request->session()->has('partner_program_id')) {
            $context->setPartnerProgramId((int) $request->session()->get('partner_program_id'));
        }

        if ($context->getPartnerProgramId() && ! $context->getPartnerProgram()) {
            $partnerProgram = PartnerProgram::find($context->getPartnerProgramId());
            $context->setPartnerProgram($partnerProgram);
        }

        return $next($request);
    }
}
