<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Offer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lead::where('webmaster_id', $user->id)->with('offer');

        foreach (['status', 'offer_id', 'geo', 'subid', 'utm_source', 'utm_campaign'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->string($filter));
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        $leads = $query->latest()->paginate(20)->withQueryString();

        $summary = [
            'leads' => (clone $query)->count(),
            'sales' => (clone $query)->where('status', 'sale')->count(),
            'payout' => (clone $query)->where('status', 'sale')->sum('payout'),
        ];
        $summary['approve'] = ($summary['sales'] + (clone $query)->whereIn('status', ['cancel', 'trash'])->count()) > 0
            ? round($summary['sales'] / ($summary['sales'] + (clone $query)->whereIn('status', ['cancel', 'trash'])->count()) * 100, 2)
            : 0;

        return Inertia::render('Webmaster/Leads/Index', [
            'leads' => $leads,
            'offers' => Offer::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['status', 'offer_id', 'geo', 'subid', 'utm_source', 'utm_campaign', 'date_from', 'date_to']),
            'summary' => $summary,
        ]);
    }
}
