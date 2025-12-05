<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PayoutRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayoutController extends Controller
{
    public function show(PayoutRequest $payoutRequest)
    {
        $payoutRequest->load('webmaster');
        $payoutRequest->created_at_human = optional($payoutRequest->created_at)->format('d.m.Y H:i');
        $payoutRequest->processed_at_human = optional($payoutRequest->processed_at)->format('d.m.Y H:i');

        return Inertia::render('Admin/Payouts/Show', [
            'payout' => $payoutRequest,
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function index(Request $request)
    {
        $perPage = in_array((int) $request->input('per_page'), [10, 25, 50]) ? (int) $request->input('per_page') : 10;
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc') === 'asc' ? 'asc' : 'desc';

        $query = PayoutRequest::query()
            ->with('webmaster')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('webmaster_id'), fn ($q) => $q->where('webmaster_id', $request->integer('webmaster_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', Carbon::parse($request->input('date_from'))->startOfDay()))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', Carbon::parse($request->input('date_to'))->endOfDay()))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->string('search')->toString();
                $q->where(function ($sub) use ($term) {
                    $sub->where('method', 'like', "%{$term}%")
                        ->orWhere('details', 'like', "%{$term}%")
                        ->orWhereHas('webmaster', function ($w) use ($term) {
                            $w->where('name', 'like', "%{$term}%")
                                ->orWhere('email', 'like', "%{$term}%");
                        });
                });
            });

        if ($sort === 'webmaster') {
            $query->orderBy(User::select('name')->whereColumn('users.id', 'payout_requests.webmaster_id'), $direction);
        } else {
            $query->orderBy(in_array($sort, ['amount', 'status', 'method', 'created_at', 'processed_at']) ? $sort : 'created_at', $direction);
        }

        if ($request->boolean('export')) {
            $rows = $query->get()->map(function ($payout) {
                return [
                    'ID' => $payout->id,
                    'Вебмастер' => $payout->webmaster?->name ?? '—',
                    'Email' => $payout->webmaster?->email ?? '—',
                    'Сумма' => $payout->amount,
                    'Метод' => $payout->method,
                    'Кошелек' => $payout->wallet_address,
                    'Статус' => $payout->status,
                    'Комментарий' => $payout->public_comment,
                    'Создано' => optional($payout->created_at)->format('d.m.Y H:i'),
                    'Обработано' => optional($payout->processed_at)->format('d.m.Y H:i'),
                ];
            });

            $callback = function () use ($rows) {
                $stream = fopen('php://output', 'w');
                fwrite($stream, "\xEF\xBB\xBF");
                fputcsv($stream, array_keys($rows->first() ?? []));
                foreach ($rows as $row) {
                    fputcsv($stream, array_values($row));
                }
                fclose($stream);
            };

            return response()->streamDownload($callback, 'payouts.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        $payouts = $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (PayoutRequest $payout) {
                $payout->created_at_human = optional($payout->created_at)->format('d.m.Y H:i');
                $payout->processed_at_human = optional($payout->processed_at)->format('d.m.Y H:i');
                return $payout;
            });

        $balances = User::where('role', User::ROLE_WEBMASTER)
            ->withSum(['leads as sale_sum' => fn ($q) => $q->where('status', 'sale')], 'payout')
            ->get()
            ->map(function (User $user) {
                $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
                $locked = PayoutRequest::where('webmaster_id', $user->id)->whereIn('status', ['pending', 'in_process'])->sum('amount');
                $user->balance = $user->sale_sum - $paid - $locked;
                return $user;
            });

        return Inertia::render('Admin/Payouts/Index', [
            'payouts' => $payouts,
            'balances' => $balances,
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)->orderBy('name')->get(['id', 'name', 'email']),
            'filters' => $request->only(['status', 'webmaster_id', 'date_from', 'date_to', 'search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'webmaster_id' => ['required', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'string', 'max:255'],
            'wallet_address' => ['nullable', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        PayoutRequest::create($validated);

        return back()->with('success', 'Заявка на выплату создана');
    }

    public function update(Request $request, PayoutRequest $payoutRequest)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_process,paid,cancelled'],
            'public_comment' => ['nullable', 'string'],
            'internal_comment' => ['nullable', 'string'],
        ]);

        $payoutRequest->status = $validated['status'];
        if ($validated['status'] === 'paid') {
            $payoutRequest->processed_at = now();
        }
        $payoutRequest->public_comment = $validated['public_comment'] ?? $payoutRequest->public_comment;
        $payoutRequest->internal_comment = $validated['internal_comment'] ?? $payoutRequest->internal_comment;
        $payoutRequest->save();

        return back()->with('success', 'Статус выплаты обновлен');
    }
}
