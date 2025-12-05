<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferWebmasterRate;
use App\Models\PayoutRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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

        $query = $query->select('*')->addSelect([
            'leads_count' => Lead::selectRaw('count(*)')->whereColumn('webmaster_id', 'users.id'),
            'sales_count' => Lead::selectRaw('count(*)')
                ->whereColumn('webmaster_id', 'users.id')
                ->where('status', 'sale'),
            'payout_sum' => Lead::selectRaw('coalesce(sum(payout),0)')
                ->whereColumn('webmaster_id', 'users.id')
                ->where('status', 'sale'),
        ]);

        if (in_array($sort, ['name', 'created_at', 'leads_count', 'sales_count'], true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('name');
        }

        $webmasters = $query->paginate($perPage)->withQueryString();

        $webmasters->getCollection()->transform(function (User $user) {
            $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
            $payout = (float) ($user->payout_sum ?? 0);
            $balance = $payout - (float) $paid;
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
            'min_payout' => ['nullable', 'numeric', 'min:0'],
        ]);

        $password = Str::password(10);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'telegram' => $validated['telegram'] ?? null,
            'note' => $validated['note'] ?? null,
            'password' => Hash::make($password),
            'role' => User::ROLE_WEBMASTER,
            'min_payout' => $validated['min_payout'] ?? 0,
        ]);

        $this->sendCredentialsEmail($user, $password, $request->user());

        return back()->with('success', 'Вебмастер создан и письмо с доступом отправлено.');
    }

    public function show(User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);

        $user->load(['rates.offer', 'leads.offer']);

        $stats = [
            'leads' => Lead::where('webmaster_id', $user->id)->count(),
            'sales' => Lead::where('webmaster_id', $user->id)->where('status', 'sale')->count(),
            'payout' => (float) Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout'),
        ];

        $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
        $balance = $stats['payout'] - $paid;

        $offers = Offer::with(['categories'])
            ->orderBy('name')
            ->get()
            ->map(function (Offer $offer) use ($user) {
                $rate = OfferWebmasterRate::where('offer_id', $offer->id)
                    ->where('webmaster_id', $user->id)
                    ->first();
                $offer->custom_payout = $rate?->custom_payout;
                $offer->is_allowed = $rate?->is_allowed ?? true;
                return $offer;
            });

        return Inertia::render('Admin/Webmasters/Show', [
            'webmaster' => $user,
            'stats' => $stats,
            'balance' => $balance,
            'offers' => $offers,
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
            'dashboard_message' => ['nullable', 'string'],
            'min_payout' => ['nullable', 'numeric', 'min:0'],
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

    public function updateRate(Request $request, User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);

        $data = $request->validate([
            'offer_id' => ['required', 'exists:offers,id'],
            'custom_payout' => ['nullable', 'numeric', 'min:0'],
            'is_allowed' => ['required', 'boolean'],
        ]);

        OfferWebmasterRate::updateOrCreate(
            ['offer_id' => $data['offer_id'], 'webmaster_id' => $user->id],
            ['custom_payout' => $data['custom_payout'], 'is_allowed' => $data['is_allowed']]
        );

        return back()->with('success', 'Настройки по офферу обновлены');
    }

    public function createPayout(Request $request, User $user)
    {
        abort_unless($user->role === User::ROLE_WEBMASTER, 404);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        PayoutRequest::create([
            'webmaster_id' => $user->id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'details' => $data['details'] ?? '',
            'status' => 'pending',
        ]);

        return back()->with('success', 'Заявка на выплату создана');
    }
}
