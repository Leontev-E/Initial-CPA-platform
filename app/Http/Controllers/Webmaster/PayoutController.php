<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\PayoutRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayoutController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $payouts = PayoutRequest::where('webmaster_id', $user->id)
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(function (PayoutRequest $payout) {
                $payout->created_at_human = optional($payout->created_at)->format('d.m.Y H:i');
                return $payout;
            });

        $earned = Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout');
        $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
        $locked = PayoutRequest::where('webmaster_id', $user->id)->whereIn('status', ['pending', 'in_process'])->sum('amount');
        $manual = \App\Models\BalanceAdjustment::where('webmaster_id', $user->id)->sum('amount');
        $available = $earned + $manual - $paid - $locked;
        $minPayout = $user->min_payout ?? 0;
        $canRequest = $available >= $minPayout;

        return Inertia::render('Webmaster/Payouts/Index', [
            'payouts' => $payouts,
            'balance' => $available,
            'minPayout' => $minPayout,
            'canRequest' => $canRequest,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'string', 'in:USDT TRC20,Карта банка'],
            'wallet_address' => ['required', 'string', 'max:255'],
        ]);

        $earned = Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout');
        $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
        $locked = PayoutRequest::where('webmaster_id', $user->id)->whereIn('status', ['pending', 'in_process'])->sum('amount');
        $manual = \App\Models\BalanceAdjustment::where('webmaster_id', $user->id)->sum('amount');
        $available = $earned + $manual - $paid - $locked;
        $minPayout = $user->min_payout ?? 0;

        if ($available < $minPayout) {
            return back()->withErrors(['amount' => 'Минимальный порог для заявки '.$minPayout.' $, доступно '.$available.' $.']);
        }

        if ($validated['amount'] > $available) {
            return back()->withErrors(['amount' => 'Недостаточно баланса для заявки']);
        }

        if ($validated['amount'] < $minPayout) {
            return back()->withErrors(['amount' => 'Минимальная сумма заявки '.$minPayout.' $']);
        }

        PayoutRequest::create([
            'webmaster_id' => $user->id,
            'amount' => $validated['amount'],
            'method' => $validated['method'],
            'wallet_address' => $validated['wallet_address'],
            'details' => '',
            'status' => 'pending',
        ]);

        return back()->with('success', 'Заявка отправлена');
    }
}
