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

        $offers = Offer::where('is_active', true)
            ->with('category')
            ->orderBy('name')
            ->get()
            ->map(function (Offer $offer) use ($user) {
                $custom = OfferWebmasterRate::where('offer_id', $offer->id)
                    ->where('webmaster_id', $user->id)
                    ->value('custom_payout');
                $offer->effective_payout = $custom ?? $offer->default_payout;
                return $offer;
            });

        return Inertia::render('Webmaster/Offers/Index', [
            'offers' => $offers,
        ]);
    }

    public function show(Request $request, Offer $offer)
    {
        $user = $request->user();
        $custom = OfferWebmasterRate::where('offer_id', $offer->id)
            ->where('webmaster_id', $user->id)
            ->value('custom_payout');

        $offer->load('category');
        $offer->effective_payout = $custom ?? $offer->default_payout;

        return Inertia::render('Webmaster/Offers/Show', [
            'offer' => $offer,
        ]);
    }
}
