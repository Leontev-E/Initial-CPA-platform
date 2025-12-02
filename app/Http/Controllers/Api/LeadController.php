<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Lead;
use App\Models\Offer;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $request)
    {
        $apiKey = ApiKey::where('key', $request->header('X-API-KEY'))
            ->where('is_active', true)
            ->first();

        if (! $apiKey || ! $apiKey->webmaster?->is_active) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'offer_id' => ['required', 'exists:offers,id'],
            'geo' => ['required', 'string', 'max:4'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email'],
            'subid' => ['nullable', 'string', 'max:255'],
            'landing_url' => ['nullable', 'url'],
            'ip' => ['nullable', 'string', 'max:45'],
            'user_agent' => ['nullable', 'string'],
            'utm_source' => ['nullable', 'string', 'max:255'],
            'utm_medium' => ['nullable', 'string', 'max:255'],
            'utm_campaign' => ['nullable', 'string', 'max:255'],
            'utm_term' => ['nullable', 'string', 'max:255'],
            'utm_content' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'extra_data' => ['nullable', 'array'],
        ]);

        $offer = Offer::where('id', $validated['offer_id'])->where('is_active', true)->first();
        if (! $offer) {
            return response()->json(['message' => 'Offer inactive'], 400);
        }

        $lead = Lead::create([
            'offer_id' => $offer->id,
            'webmaster_id' => $apiKey->webmaster_id,
            'geo' => strtoupper($validated['geo']),
            'status' => 'new',
            'payout' => null,
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'extra_data' => $validated['extra_data'] ?? null,
            'subid' => $validated['subid'] ?? null,
            'ip' => $validated['ip'] ?? $request->ip(),
            'user_agent' => $validated['user_agent'] ?? $request->userAgent(),
            'landing_url' => $validated['landing_url'] ?? null,
            'utm_source' => $validated['utm_source'] ?? null,
            'utm_medium' => $validated['utm_medium'] ?? null,
            'utm_campaign' => $validated['utm_campaign'] ?? null,
            'utm_term' => $validated['utm_term'] ?? null,
            'utm_content' => $validated['utm_content'] ?? null,
            'tags' => $validated['tags'] ?? null,
        ]);

        $apiKey->update(['last_used_at' => now()]);

        return response()->json([
            'status' => 'ok',
            'lead_id' => $lead->id,
        ]);
    }
}
