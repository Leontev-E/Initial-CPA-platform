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
        $payouts = PayoutRequest::where('webmaster_id', $user->id)->latest()->get();

        $earned = Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout');
        $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
        $locked = PayoutRequest::where('webmaster_id', $user->id)->whereIn('status', ['pending', 'in_process'])->sum('amount');
        $available = $earned - $paid - $locked;

        return Inertia::render('Webmaster/Payouts/Index', [
            'payouts' => $payouts,
            'balance' => $available,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        $earned = Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout');
        $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
        $locked = PayoutRequest::where('webmaster_id', $user->id)->whereIn('status', ['pending', 'in_process'])->sum('amount');
        $available = $earned - $paid - $locked;

        if ($validated['amount'] > $available) {
            return back()->withErrors(['amount' => 'Недостаточно баланса для заявки']);
        }

        PayoutRequest::create([
            'webmaster_id' => $user->id,
            'amount' => $validated['amount'],
            'method' => $validated['method'],
            'details' => $validated['details'] ?? '',
            'status' => 'pending',
        ]);

        return back()->with('success', 'Заявка отправлена');
    }
}
