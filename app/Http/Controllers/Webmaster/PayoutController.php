<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\PayoutRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayoutController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $filters = [
            'status' => $request->string('status')->toString(),
            'method' => $request->string('method')->toString(),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'per_page' => (int) $request->input('per_page', 10),
        ];
        $perPage = in_array($filters['per_page'], [10, 25, 50]) ? $filters['per_page'] : 10;

        $payouts = PayoutRequest::where('webmaster_id', $user->id)
            ->when($filters['status'], fn ($q, $status) => $q->where('status', $status))
            ->when($filters['method'], fn ($q, $method) => $q->where('method', $method))
            ->when($filters['date_from'], fn ($q, $from) => $q->whereDate('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['date_to'], fn ($q, $to) => $q->whereDate('created_at', '<=', Carbon::parse($to)->endOfDay()))
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (PayoutRequest $payout) {
                $payout->created_at_human = optional($payout->created_at)->format('d.m.Y H:i');
                $payout->public_comment = $payout->public_comment;
                return $payout;
            });
        $methods = PayoutRequest::where('webmaster_id', $user->id)
            ->select('method')
            ->distinct()
            ->pluck('method')
            ->filter()
            ->values()
            ->all();

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
            'filters' => $filters,
            'methods' => $methods,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $wallets = $user->payout_wallets ?? [];
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'wallet_id' => ['required', 'integer', 'min:0'],
        ]);
        if (! isset($wallets[$validated['wallet_id']])) {
            return back()->withErrors(['wallet_id' => 'Добавьте реквизиты в профиле и попробуйте снова.']);
        }
        $wallet = $wallets[$validated['wallet_id']];
        $method = $wallet['type'] ?? 'Other';
        $address = trim((string) ($wallet['details'] ?? ''));
        if ($address === '') {
            return back()->withErrors(['wallet_id' => 'В выбранном реквизите нет данных. Обновите его в профиле.']);
        }

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
            'partner_program_id' => $user->partner_program_id,
            'webmaster_id' => $user->id,
            'amount' => $validated['amount'],
            'method' => $method,
            'wallet_address' => $address,
            'details' => '',
            'status' => 'pending',
        ]);

        return back()->with('success', 'Заявка отправлена');
    }
}
