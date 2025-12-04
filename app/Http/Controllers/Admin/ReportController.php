<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ReportController extends Controller
{
    public function offers(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        [$perPage, $sort, $direction] = $this->commonPagination($request, 'leads');

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
            'rows' => $this->paginateCollection($this->sortRows($rows, $sort, $direction), $perPage, $request),
            'filters' => $request->only(['offer_id', 'webmaster_id', 'geo', 'date_from', 'date_to', 'sort', 'direction', 'per_page']),
            'offers' => Offer::orderBy('name')->get(['id', 'name']),
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)->orderBy('name')->get(['id', 'name']),
            'geos' => $this->geoOptions(),
        ]);
    }

    public function webmasters(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        [$perPage, $sort, $direction] = $this->commonPagination($request, 'leads');

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
            'rows' => $this->paginateCollection($this->sortRows($rows, $sort, $direction), $perPage, $request),
            'filters' => $request->only(['offer_id', 'geo', 'date_from', 'date_to', 'sort', 'direction', 'per_page']),
            'offers' => Offer::orderBy('name')->get(['id', 'name']),
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)->orderBy('name')->get(['id', 'name']),
            'geos' => $this->geoOptions(),
        ]);
    }

    public function geo(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        [$perPage, $sort, $direction] = $this->commonPagination($request, 'geo');

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
            'rows' => $this->paginateCollection($this->sortRows($rows, $sort, $direction), $perPage, $request),
            'filters' => $request->only(['offer_id', 'webmaster_id', 'date_from', 'date_to', 'sort', 'direction', 'per_page']),
            'offers' => Offer::orderBy('name')->get(['id', 'name']),
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)->orderBy('name')->get(['id', 'name']),
            'geos' => $this->geoOptions(),
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

    protected function commonPagination(Request $request, string $defaultSort): array
    {
        $perPage = in_array((int) $request->input('per_page'), [10, 25, 50]) ? (int) $request->input('per_page') : 10;
        $sort = $request->input('sort', $defaultSort);
        $direction = $request->input('direction', 'desc') === 'asc' ? 'asc' : 'desc';

        return [$perPage, $sort, $direction];
    }

    protected function sortRows(Collection $rows, string $sort, string $direction): Collection
    {
        $allowed = ['offer', 'webmaster', 'geo', 'leads', 'sales', 'rejected', 'conversion', 'approve', 'payout_sum', 'avg_payout'];
        $sortKey = in_array($sort, $allowed) ? $sort : 'leads';

        return $rows->sortBy($sortKey, SORT_REGULAR, $direction === 'desc')->values();
    }

    protected function paginateCollection(Collection $collection, int $perPage, Request $request): LengthAwarePaginator
    {
        $page = $request->integer('page', 1);
        $items = $collection->forPage($page, $perPage)->values();

        return new LengthAwarePaginator(
            $items,
            $collection->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );
    }

    protected function geoOptions()
    {
        return Lead::select('geo')->whereNotNull('geo')->distinct()->orderBy('geo')->pluck('geo');
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
