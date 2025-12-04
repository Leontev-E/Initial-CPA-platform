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
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50], true) ? $perPage : 10;
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc') === 'desc' ? 'desc' : 'asc';
        $status = $request->input('status');

        $query = User::query()->where('role', User::ROLE_WEBMASTER);

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('email', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhere('name', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhere('telegram', 'like', '%'.$request->string('search')->toString().'%');
            });
        }

        $query = $query
            ->withCount([
                'leads',
                'leads as sales_count' => fn ($q) => $q->where('status', 'sale'),
            ])
            ->withSum(['leads as payout_sum' => fn ($q) => $q->where('status', 'sale')], 'payout')
            ->select('*');

        if (in_array($sort, ['name', 'created_at', 'leads_count', 'sales_count'], true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('name');
        }

        $webmasters = $query->paginate($perPage)->withQueryString();

        $webmasters->getCollection()->transform(function (User $user) {
            $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
            $balance = $user->payout_sum - $paid;
            $user->balance = $balance;
            $user->created_at_human = $user->created_at?->format('d.m.Y');
            return $user;
        });

        return Inertia::render('Admin/Webmasters/Index', [
            'webmasters' => $webmasters,
            'filters' => $request->only(['status', 'search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telegram' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
        ]);

        $password = Str::password(10);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'telegram' => $validated['telegram'] ?? null,
            'note' => $validated['note'] ?? null,
            'password' => Hash::make($password),
            'role' => User::ROLE_WEBMASTER,
        ]);

        $this->sendCredentialsEmail($user, $password, $request->user());

        return back()->with('success', 'Вебмастер создан и письмо с доступом отправлено.');
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
            'name' => ['required', 'string', 'max:255'],
            'telegram' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
        ]);

        $user->update($validated);

        return back()->with('success', 'Статус вебмастера обновлен');
    }

    public function updatePassword(Request $request, User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user->update([
            'password' => $validated['password'],
        ]);

        return back()->with('success', 'Пароль обновлен');
    }

    public function resendPassword(Request $request, User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);

        $password = Str::password(10);
        $user->update(['password' => Hash::make($password)]);

        $this->sendCredentialsEmail($user, $password, $request->user());

        return back()->with('success', 'Новый пароль отправлен на email вебмастера.');
    }

    public function destroy(User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);
        $user->delete();

        return redirect()->route('admin.webmasters.index')->with('success', 'Вебмастер удален');
    }

    public function impersonate(Request $request, User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);
        abort_unless($request->user()->canImpersonateWebmaster(), 403);

        $adminId = $request->user()->id;
        $request->session()->put('impersonate_admin_id', $adminId);
        auth()->login($user);

        return redirect()->route('webmaster.dashboard');
    }

    public function stopImpersonate(Request $request)
    {
        $adminId = $request->session()->pull('impersonate_admin_id');
        if ($adminId) {
            auth()->loginUsingId($adminId);
        }

        return redirect()->route('admin.dashboard');
    }

    protected function sendCredentialsEmail(User $user, string $password, User $inviter): void
    {
        \Mail::send('emails.webmaster_invite', [
            'user' => $user,
            'password' => $password,
            'inviter' => $inviter,
        ], function ($message) use ($user) {
            $message->to($user->email)->subject('Доступ к партнерской программе BoostClicks');
        });
    }
}
