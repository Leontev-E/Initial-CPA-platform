<?php

namespace App\Http\Middleware;

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

        $webmasterMeta = null;
        if ($user && $user->role === 'webmaster') {
            $earned = (float) \App\Models\Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout');
            $paid = (float) \App\Models\PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
            $locked = (float) \App\Models\PayoutRequest::where('webmaster_id', $user->id)->whereIn('status', ['pending', 'in_process'])->sum('amount');
            $available = $earned - $paid - $locked;
            $webmasterMeta = [
                'balance' => $available,
                'min_payout' => (float) ($user->min_payout ?? 0),
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'webmasterMeta' => $webmasterMeta,
            ],
            'locale' => app()->getLocale(),
            'impersonating' => (bool) $request->session()->get('impersonate_admin_id'),
        ];
    }
}
