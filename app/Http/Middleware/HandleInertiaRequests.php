<?php

namespace App\Http\Middleware;

use App\Support\PartnerProgramContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $partnerProgram = app(PartnerProgramContext::class)->getPartnerProgram();

        $webmasterMeta = null;
        if ($user && method_exists($user, 'isWebmaster') && $user->isWebmaster()) {
            $earned = (float) \App\Models\Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout');
            $paid = (float) \App\Models\PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
            $locked = (float) \App\Models\PayoutRequest::where('webmaster_id', $user->id)->whereIn('status', ['pending', 'in_process'])->sum('amount');
            $manual = (float) \App\Models\BalanceAdjustment::where('webmaster_id', $user->id)->sum('amount');
            $available = $earned + $manual - $paid - $locked;
            $webmasterMeta = [
                'balance' => $available,
                'min_payout' => (float) ($user->min_payout ?? 0),
            ];
        }

        $pendingPayouts = 0;
        if ($user && method_exists($user, 'isPartnerAdmin') && $user->isPartnerAdmin()) {
            $pendingPayouts = (int) \App\Models\PayoutRequest::where('status', 'pending')->count();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'webmasterMeta' => $webmasterMeta,
            ],
            'partnerProgram' => $partnerProgram ? $partnerProgram->only(['id', 'name', 'slug', 'status', 'domain']) : null,
            'locale' => app()->getLocale(),
            'impersonating' => (bool) $request->session()->get('impersonate_admin_id'),
            'pendingPayouts' => $pendingPayouts,
        ];
    }
}
