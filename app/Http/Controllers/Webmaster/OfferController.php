<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferWebmasterRate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OfferController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $perPage = in_array((int) $request->input('per_page'), [12, 24, 48], true) ? (int) $request->input('per_page') : 12;
        $search = $request->string('search')->toString();
        $categoryId = $request->integer('category_id');
        $geoFilters = array_filter(array_map('trim', (array) $request->input('geos', [])));

        $query = Offer::where('is_active', true)
            ->whereHas('category', fn ($q) => $q->where('is_active', true))
            ->whereDoesntHave('categories', fn ($q) => $q->where('is_active', false))
            ->with(['category', 'categories'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('id', $search);
                });
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where(function ($sub) use ($categoryId) {
                    $sub->where('offer_category_id', $categoryId)
                        ->orWhereHas('categories', fn ($c) => $c->where('offer_category_id', $categoryId));
                });
            })
            ->when(!empty($geoFilters), function ($q) use ($geoFilters) {
                $q->where(function ($sub) use ($geoFilters) {
                    foreach ($geoFilters as $geo) {
                        $sub->orWhereJsonContains('allowed_geos', strtoupper($geo));
                    }
                });
            })
            ->orderBy('name');

        $offers = $query->paginate($perPage)->withQueryString()->through(function (Offer $offer) use ($user) {
            $custom = OfferWebmasterRate::where('offer_id', $offer->id)
                ->where('webmaster_id', $user->id)
                ->value('custom_payout');
            $offer->effective_payout = $custom ?? $offer->default_payout;
            return $offer;
        });

        return Inertia::render('Webmaster/Offers/Index', [
            'offers' => $offers,
            'filters' => $request->only(['search', 'category_id', 'geos', 'per_page']),
            'categories' => \App\Models\OfferCategory::orderBy('name')->get(['id', 'name']),
            'geos' => \App\Models\Offer::select('allowed_geos')->whereNotNull('allowed_geos')->get()->pluck('allowed_geos')->flatten()->unique()->values(),
        ]);
    }

    public function show(Request $request, Offer $offer)
    {
        $user = $request->user();
        $custom = OfferWebmasterRate::where('offer_id', $offer->id)
            ->where('webmaster_id', $user->id)
            ->value('custom_payout');

        $offer->load(['category', 'categories', 'landings']);
        $offer->effective_payout = $custom ?? $offer->default_payout;

        return Inertia::render('Webmaster/Offers/Show', [
            'offer' => $offer,
        ]);
    }
}
