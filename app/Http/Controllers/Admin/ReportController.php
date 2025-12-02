<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function offers(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        $rows = Lead::query()
            ->select(
                'offer_id',
                DB::raw('count(*) as leads'),
                DB::raw('sum(case when status = "sale" then 1 else 0 end) as sales'),
                DB::raw('sum(case when status in ("cancel","trash") then 1 else 0 end) as rejected'),
                DB::raw('sum(case when status = "sale" then payout else 0 end) as payout_sum')
            )
            ->whereBetween('created_at', [$from, $to])
            ->when($request->filled('offer_id'), fn ($q) => $q->where('offer_id', $request->integer('offer_id')))
            ->when($request->filled('webmaster_id'), fn ($q) => $q->where('webmaster_id', $request->integer('webmaster_id')))
            ->when($request->filled('geo'), fn ($q) => $q->where('geo', strtoupper($request->string('geo')->toString())))
            ->groupBy('offer_id')
            ->with('offer:id,name')
            ->get()
            ->map(function ($row) {
                $approveDenominator = $row->sales + $row->rejected;
                $conversion = $row->leads > 0 ? round($row->sales / $row->leads * 100, 2) : 0;
                $approve = $approveDenominator > 0 ? round($row->sales / $approveDenominator * 100, 2) : 0;
                $avgPayout = $row->sales > 0 ? round($row->payout_sum / $row->sales, 2) : 0;

                return [
                    'offer' => $row->offer?->name ?? 'N/A',
                    'leads' => $row->leads,
                    'sales' => $row->sales,
                    'rejected' => $row->rejected,
                    'conversion' => $conversion,
                    'approve' => $approve,
                    'payout_sum' => (float) $row->payout_sum,
                    'avg_payout' => $avgPayout,
                ];
            });

        if ($request->boolean('export')) {
            return $this->csvResponse('offer-report.csv', $rows, [
                'Оффер', 'Лиды', 'Продажи', 'Cancel+Trash', 'Конверсия %', 'Апрув %', 'Payout суммарно', 'Средний payout',
            ]);
        }

        return inertia('Admin/Reports/Offers', [
            'rows' => $rows,
            'filters' => $request->only(['offer_id', 'webmaster_id', 'geo', 'date_from', 'date_to']),
        ]);
    }

    public function webmasters(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        $rows = Lead::query()
            ->select(
                'webmaster_id',
                DB::raw('count(*) as leads'),
                DB::raw('sum(case when status = "sale" then 1 else 0 end) as sales'),
                DB::raw('sum(case when status in ("cancel","trash") then 1 else 0 end) as rejected'),
                DB::raw('sum(case when status = "sale" then payout else 0 end) as payout_sum')
            )
            ->whereBetween('created_at', [$from, $to])
            ->when($request->filled('offer_id'), fn ($q) => $q->where('offer_id', $request->integer('offer_id')))
            ->when($request->filled('geo'), fn ($q) => $q->where('geo', strtoupper($request->string('geo')->toString())))
            ->groupBy('webmaster_id')
            ->with('webmaster:id,name')
            ->get()
            ->map(function ($row) {
                $approveDenominator = $row->sales + $row->rejected;
                $conversion = $row->leads > 0 ? round($row->sales / $row->leads * 100, 2) : 0;
                $approve = $approveDenominator > 0 ? round($row->sales / $approveDenominator * 100, 2) : 0;
                $avgPayout = $row->sales > 0 ? round($row->payout_sum / $row->sales, 2) : 0;

                return [
                    'webmaster' => $row->webmaster?->name ?? 'N/A',
                    'leads' => $row->leads,
                    'sales' => $row->sales,
                    'rejected' => $row->rejected,
                    'conversion' => $conversion,
                    'approve' => $approve,
                    'payout_sum' => (float) $row->payout_sum,
                    'avg_payout' => $avgPayout,
                ];
            });

        if ($request->boolean('export')) {
            return $this->csvResponse('webmaster-report.csv', $rows, [
                'Вебмастер', 'Лиды', 'Продажи', 'Cancel+Trash', 'Конверсия %', 'Апрув %', 'Payout суммарно', 'Средний payout',
            ]);
        }

        return inertia('Admin/Reports/Webmasters', [
            'rows' => $rows,
            'filters' => $request->only(['offer_id', 'geo', 'date_from', 'date_to']),
        ]);
    }

    public function geo(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        $rows = Lead::query()
            ->select(
                'geo',
                DB::raw('count(*) as leads'),
                DB::raw('sum(case when status = "sale" then 1 else 0 end) as sales'),
                DB::raw('sum(case when status in ("cancel","trash") then 1 else 0 end) as rejected'),
                DB::raw('sum(case when status = "sale" then payout else 0 end) as payout_sum')
            )
            ->whereBetween('created_at', [$from, $to])
            ->when($request->filled('offer_id'), fn ($q) => $q->where('offer_id', $request->integer('offer_id')))
            ->when($request->filled('webmaster_id'), fn ($q) => $q->where('webmaster_id', $request->integer('webmaster_id')))
            ->groupBy('geo')
            ->orderBy('geo')
            ->get()
            ->map(function ($row) {
                $approveDenominator = $row->sales + $row->rejected;
                $conversion = $row->leads > 0 ? round($row->sales / $row->leads * 100, 2) : 0;
                $approve = $approveDenominator > 0 ? round($row->sales / $approveDenominator * 100, 2) : 0;
                $avgPayout = $row->sales > 0 ? round($row->payout_sum / $row->sales, 2) : 0;

                return [
                    'geo' => $row->geo,
                    'leads' => $row->leads,
                    'sales' => $row->sales,
                    'rejected' => $row->rejected,
                    'conversion' => $conversion,
                    'approve' => $approve,
                    'payout_sum' => (float) $row->payout_sum,
                    'avg_payout' => $avgPayout,
                ];
            });

        if ($request->boolean('export')) {
            return $this->csvResponse('geo-report.csv', $rows, [
                'GEO', 'Лиды', 'Продажи', 'Cancel+Trash', 'Конверсия %', 'Апрув %', 'Payout суммарно', 'Средний payout',
            ]);
        }

        return inertia('Admin/Reports/Geo', [
            'rows' => $rows,
            'filters' => $request->only(['offer_id', 'webmaster_id', 'date_from', 'date_to']),
        ]);
    }

    protected function dateRange(Request $request): array
    {
        $from = $request->filled('date_from')
            ? Carbon::parse($request->date_from)->startOfDay()
            : now()->subDays(6)->startOfDay();
        $to = $request->filled('date_to')
            ? Carbon::parse($request->date_to)->endOfDay()
            : now()->endOfDay();

        return [$from, $to];
    }

    protected function csvResponse(string $filename, $rows, array $headers)
    {
        $callback = function () use ($rows, $headers) {
            $stream = fopen('php://output', 'w');
            fputcsv($stream, $headers);
            foreach ($rows as $row) {
                fputcsv($stream, array_values($row));
            }
            fclose($stream);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
