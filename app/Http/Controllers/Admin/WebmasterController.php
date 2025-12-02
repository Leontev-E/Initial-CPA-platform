<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferWebmasterRate;
use App\Models\PayoutRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WebmasterController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->where('role', User::ROLE_WEBMASTER);

        if ($request->filled('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('email', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhere('name', 'like', '%'.$request->string('search')->toString().'%');
            });
        }

        $webmasters = $query
            ->withCount([
                'leads',
                'leads as sales_count' => fn ($q) => $q->where('status', 'sale'),
            ])
            ->withSum(['leads as payout_sum' => fn ($q) => $q->where('status', 'sale')], 'payout')
            ->paginate(15)
            ->withQueryString();

        $webmasters->getCollection()->transform(function (User $user) {
            $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
            $balance = $user->payout_sum - $paid;
            $user->balance = $balance;
            return $user;
        });

        return Inertia::render('Admin/Webmasters/Index', [
            'webmasters' => $webmasters,
            'filters' => $request->only(['active', 'search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $password = $validated['password'] ?? Str::password(10);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'role' => User::ROLE_WEBMASTER,
        ]);

        return back()->with('success', 'Вебмастер создан. Временный пароль: '.$password);
    }

    public function show(User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);

        $user->load(['rates.offer', 'leads.offer']);

        $stats = [
            'leads' => $user->leads()->count(),
            'sales' => $user->leads()->where('status', 'sale')->count(),
            'payout' => $user->leads()->where('status', 'sale')->sum('payout'),
        ];

        $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
        $balance = $stats['payout'] - $paid;

        return Inertia::render('Admin/Webmasters/Show', [
            'webmaster' => $user,
            'stats' => $stats,
            'balance' => $balance,
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user->update($validated);

        return back()->with('success', 'Статус вебмастера обновлен');
    }
}
