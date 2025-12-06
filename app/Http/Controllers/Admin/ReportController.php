<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function offers(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        [$perPage, $sort, $direction] = $this->commonPagination($request, 'leads');

        $base = Lead::query()
            ->whereBetween('created_at', [$from, $to])
            ->when($request->filled('offer_id'), fn ($q) => $q->where('offer_id', $request->integer('offer_id')))
            ->when($this->geos($request), fn ($q, $geos) => $q->whereIn('geo', $geos));

        if ($request->filled('search')) {
            $term = $request->string('search')->toString();
            $ids = User::where('role', User::ROLE_WEBMASTER)
                ->where(function ($q) use ($term) {
                    $q->where('name', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%")
                        ->orWhere('telegram', 'like', "%{$term}%");
                })
                ->pluck('id');
            $base->whereIn('webmaster_id', $ids);
        }

        $rows = $base
            ->select(
                'webmaster_id',
                DB::raw('count(*) as leads'),
                DB::raw("sum(case when status = 'new' then 1 else 0 end) as new_count"),
                DB::raw("sum(case when status = 'in_work' then 1 else 0 end) as in_work_count"),
                DB::raw("sum(case when status = 'sale' then 1 else 0 end) as sale_count"),
                DB::raw("sum(case when status = 'cancel' then 1 else 0 end) as cancel_count"),
                DB::raw("sum(case when status = 'trash' then 1 else 0 end) as trash_count"),
                DB::raw("sum(case when status = 'sale' then payout else 0 end) as payout_sum")
            )
            ->groupBy('webmaster_id')
            ->with('webmaster:id,name,email,telegram')
            ->get()
            ->map(function ($row) {
                $leads = (int) $row->leads;
                $pct = fn ($v) => $leads > 0 ? round($v / $leads * 100, 2) : 0;
                $approve = $pct($row->sale_count);

                return [
                    'webmaster_id' => $row->webmaster_id,
                    'webmaster' => $row->webmaster?->name ?? 'N/A',
                    'email' => $row->webmaster?->email,
                    'telegram' => $row->webmaster?->telegram,
                    'leads' => $leads,
                    'new' => (int) $row->new_count,
                    'in_work' => (int) $row->in_work_count,
                    'sale' => (int) $row->sale_count,
                    'cancel' => (int) $row->cancel_count,
                    'trash' => (int) $row->trash_count,
                    'pct_new' => $pct($row->new_count),
                    'pct_in_work' => $pct($row->in_work_count),
                    'pct_sale' => $approve,
                    'pct_cancel' => $pct($row->cancel_count),
                    'pct_trash' => $pct($row->trash_count),
                    'payout_sum' => (float) $row->payout_sum,
                ];
            });

        if ($request->boolean('export')) {
            return $this->csvResponse('offer-report.csv', $rows, [
                'Вебмастер', 'Email', 'Telegram', 'Лиды', 'Новый', 'В работе', 'Продажа', 'Отмена', 'Треш', 'Новый %', 'В работе %', 'Апрув %', 'Отмена %', 'Треш %', 'Payout суммарно',
            ]);
        }

        return inertia('Admin/Reports/Offers', [
            'rows' => $this->paginateCollection($this->sortRows($rows, $sort, $direction), $perPage, $request),
            'filters' => array_merge(
                $request->only(['offer_id', 'date_from', 'date_to', 'sort', 'direction', 'per_page', 'search']),
                ['geo' => $this->geos($request)]
            ),
            'offers' => Offer::orderBy('name')->get(['id', 'name']),
            'geos' => $this->geoOptions(),
        ]);
    }

    public function offersByWebmaster(Request $request, User $webmaster)
    {
        abort_unless($webmaster->role === User::ROLE_WEBMASTER, 404);
        [$from, $to] = $this->dateRange($request);
        [$perPage, $sort, $direction] = $this->commonPagination($request, 'leads');

        $rows = Lead::query()
            ->where('webmaster_id', $webmaster->id)
            ->whereBetween('created_at', [$from, $to])
            ->when($request->filled('offer_id'), fn ($q) => $q->where('offer_id', $request->integer('offer_id')))
            ->when($this->geos($request), fn ($q, $geos) => $q->whereIn('geo', $geos))
            ->select(
                'offer_id',
                DB::raw('count(*) as leads'),
                DB::raw("sum(case when status = 'new' then 1 else 0 end) as new_count"),
                DB::raw("sum(case when status = 'in_work' then 1 else 0 end) as in_work_count"),
                DB::raw("sum(case when status = 'sale' then 1 else 0 end) as sale_count"),
                DB::raw("sum(case when status = 'cancel' then 1 else 0 end) as cancel_count"),
                DB::raw("sum(case when status = 'trash' then 1 else 0 end) as trash_count"),
                DB::raw("sum(case when status = 'sale' then payout else 0 end) as payout_sum")
            )
            ->groupBy('offer_id')
            ->with('offer:id,name')
            ->get()
            ->map(function ($row) {
                $leads = (int) $row->leads;
                $pct = fn ($v) => $leads > 0 ? round($v / $leads * 100, 2) : 0;
                return [
                    'offer_id' => $row->offer_id,
                    'offer' => $row->offer?->name ?? 'N/A',
                    'leads' => $leads,
                    'new' => (int) $row->new_count,
                    'in_work' => (int) $row->in_work_count,
                    'sale' => (int) $row->sale_count,
                    'cancel' => (int) $row->cancel_count,
                    'trash' => (int) $row->trash_count,
                    'pct_new' => $pct($row->new_count),
                    'pct_in_work' => $pct($row->in_work_count),
                    'pct_sale' => $pct($row->sale_count),
                    'pct_cancel' => $pct($row->cancel_count),
                    'pct_trash' => $pct($row->trash_count),
                    'payout_sum' => (float) $row->payout_sum,
                ];
            });

        if ($request->boolean('export')) {
            return $this->csvResponse('webmaster-offers-report.csv', $rows, [
                'Оффер', 'Лиды', 'Новый', 'В работе', 'Продажа', 'Отмена', 'Треш', 'Новый %', 'В работе %', 'Продажа %', 'Отмена %', 'Треш %', 'Payout суммарно',
            ]);
        }

        return inertia('Admin/Reports/OffersByWebmaster', [
            'rows' => $this->paginateCollection($this->sortRows($rows, $sort, $direction), $perPage, $request),
            'filters' => array_merge(
                $request->only(['offer_id', 'date_from', 'date_to', 'sort', 'direction', 'per_page']),
                ['geo' => $this->geos($request)]
            ),
            'offers' => Offer::orderBy('name')->get(['id', 'name']),
            'geos' => $this->geoOptions(),
            'webmaster' => $webmaster->only(['id', 'name', 'email', 'telegram']),
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
                DB::raw("sum(case when status = 'sale' then 1 else 0 end) as sales"),
                DB::raw("sum(case when status in ('cancel','trash') then 1 else 0 end) as rejected"),
                DB::raw("sum(case when status = 'sale' then payout else 0 end) as payout_sum")
            )
            ->whereBetween('created_at', [$from, $to])
            ->when($request->filled('offer_id'), fn ($q) => $q->where('offer_id', $request->integer('offer_id')))
            ->when($this->geos($request), fn ($q, $geos) => $q->whereIn('geo', $geos))
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
            'filters' => array_merge(
                $request->only(['offer_id', 'date_from', 'date_to', 'sort', 'direction', 'per_page']),
                ['geo' => $this->geos($request)]
            ),
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
                DB::raw("sum(case when status = 'sale' then 1 else 0 end) as sales"),
                DB::raw("sum(case when status in ('cancel','trash') then 1 else 0 end) as rejected"),
                DB::raw("sum(case when status = 'sale' then payout else 0 end) as payout_sum")
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
        $allowed = ['offer', 'webmaster', 'geo', 'leads', 'sales', 'rejected', 'conversion', 'approve', 'payout_sum', 'avg_payout', 'new', 'in_work', 'sale', 'cancel', 'trash', 'pct_sale', 'pct_trash'];
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
        return Cache::remember('report_geo_options', 300, function () {
            return Lead::select('geo')->whereNotNull('geo')->distinct()->orderBy('geo')->pluck('geo');
        });
    }

    private function geos(Request $request): array
    {
        return collect((array) $request->input('geo'))
            ->filter()
            ->map(fn ($g) => strtoupper($g))
            ->unique()
            ->values()
            ->all();
    }

    protected function csvResponse(string $filename, $rows, array $headers)
    {
        $callback = function () use ($rows, $headers) {
            $stream = fopen('php://output', 'w');
            // BOM, чтобы Excel корректно открывал UTF-8
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, $headers);
            foreach ($rows as $row) {
                fputcsv($stream, array_values($row));
            }
            fclose($stream);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
