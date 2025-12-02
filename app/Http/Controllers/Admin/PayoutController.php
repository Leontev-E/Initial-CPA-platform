<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PayoutRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayoutController extends Controller
{
    public function index(Request $request)
    {
        $payouts = PayoutRequest::with('webmaster')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $balances = User::where('role', User::ROLE_WEBMASTER)
            ->withSum(['leads as sale_sum' => fn ($q) => $q->where('status', 'sale')], 'payout')
            ->get()
            ->map(function (User $user) {
                $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
                $user->balance = $user->sale_sum - $paid;
                return $user;
            });

        return Inertia::render('Admin/Payouts/Index', [
            'payouts' => $payouts,
            'balances' => $balances,
            'filters' => $request->only(['status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'webmaster_id' => ['required', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        PayoutRequest::create($validated);

        return back()->with('success', 'Заявка на выплату создана');
    }

    public function update(Request $request, PayoutRequest $payoutRequest)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_process,paid,cancelled'],
        ]);

        $payoutRequest->status = $validated['status'];
        if ($validated['status'] === 'paid') {
            $payoutRequest->processed_at = now();
        }
        $payoutRequest->save();

        return back()->with('success', 'Статус выплаты обновлен');
    }
}
