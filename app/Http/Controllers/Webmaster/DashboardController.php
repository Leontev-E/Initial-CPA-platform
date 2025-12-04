<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\PayoutRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $from = $request->filled('date_from')
            ? Carbon::parse($request->date_from)->startOfDay()
            : now()->subDays(6)->startOfDay();
        $to = $request->filled('date_to')
            ? Carbon::parse($request->date_to)->endOfDay()
            : now()->endOfDay();

        $baseQuery = Lead::where('webmaster_id', $user->id)->whereBetween('created_at', [$from, $to]);

        $leadsCount = (clone $baseQuery)->count();
        $sales = (clone $baseQuery)->where('status', 'sale')->count();
        $payoutSum = (clone $baseQuery)->where('status', 'sale')->sum('payout');
        $approvedDenominator = $sales + (clone $baseQuery)->whereIn('status', ['cancel', 'trash'])->count();

        $chartData = (clone $baseQuery)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as leads_count'),
                DB::raw('sum(case when status = "sale" then 1 else 0 end) as sales_count')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        $topOffers = (clone $baseQuery)
            ->select('offer_id', DB::raw('count(*) as sales'))
            ->where('status', 'sale')
            ->groupBy('offer_id')
            ->with('offer')
            ->orderByDesc('sales')
            ->limit(5)
            ->get();

        $paid = PayoutRequest::where('webmaster_id', $user->id)->where('status', 'paid')->sum('amount');
        $totalEarned = Lead::where('webmaster_id', $user->id)->where('status', 'sale')->sum('payout');
        $balance = $totalEarned - $paid;

        return Inertia::render('Webmaster/Dashboard', [
            'leadsCount' => $leadsCount,
            'sales' => $sales,
            'payoutSum' => $payoutSum,
            'approve' => $approvedDenominator > 0 ? round($sales / $approvedDenominator * 100, 2) : 0,
            'balance' => $balance,
            'chartData' => $chartData,
            'topOffers' => $topOffers,
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'dashboardMessage' => $user->dashboard_message,
        ]);
    }
}
