<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->filled('date_from')
            ? Carbon::parse($request->date_from)->startOfDay()
            : now()->subDays(6)->startOfDay();
        $to = $request->filled('date_to')
            ? Carbon::parse($request->date_to)->endOfDay()
            : now()->endOfDay();

        $baseQuery = Lead::query()->whereBetween('created_at', [$from, $to]);

        $totalLeads = (clone $baseQuery)->count();
        $statusCounts = (clone $baseQuery)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $salesCount = $statusCounts['sale'] ?? 0;
        $cancelCount = $statusCounts['cancel'] ?? 0;
        $trashCount = $statusCounts['trash'] ?? 0;
        $totalPayout = (clone $baseQuery)->where('status', 'sale')->sum('payout');

        $topOffers = (clone $baseQuery)
            ->select('offer_id', DB::raw('count(*) as total'))
            ->where('status', 'sale')
            ->groupBy('offer_id')
            ->with('offer')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $topWebmasters = (clone $baseQuery)
            ->select('webmaster_id', DB::raw('sum(payout) as total_payout'))
            ->where('status', 'sale')
            ->groupBy('webmaster_id')
            ->with('webmaster')
            ->orderByDesc('total_payout')
            ->limit(5)
            ->get();

        $chartData = (clone $baseQuery)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as leads_count'),
                DB::raw('sum(case when status = "sale" then payout else 0 end) as payout_sum')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        $kpiConversion = $totalLeads > 0 ? round(($salesCount / $totalLeads) * 100, 2) : 0;
        $kpiApprove = ($salesCount + $cancelCount + $trashCount) > 0
            ? round($salesCount / ($salesCount + $cancelCount + $trashCount) * 100, 2)
            : 0;

        return Inertia::render('Admin/Dashboard', [
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'totalLeads' => $totalLeads,
            'statusCounts' => $statusCounts,
            'salesCount' => $salesCount,
            'totalPayout' => $totalPayout,
            'kpi' => [
                'conversion' => $kpiConversion,
                'approve' => $kpiApprove,
            ],
            'topOffers' => $topOffers,
            'topWebmasters' => $topWebmasters,
            'chartData' => $chartData,
        ]);
    }
}
