<?php

namespace App\Http\Controllers\Api;

use App\Contracts\GeoIpResolver;
use App\Http\Controllers\Controller;
use App\Jobs\SendPostbacksJob;
use App\Models\ApiKey;
use App\Models\Lead;
use App\Models\Offer;
use App\Support\PartnerProgramContext;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function __construct(private readonly GeoIpResolver $geoIpResolver)
    {
    }

    public function store(Request $request)
    {
        $apiKey = ApiKey::where('key', $request->header('X-API-KEY'))
            ->where('is_active', true)
            ->first();

        if (! $apiKey || ! $apiKey->webmaster?->is_active) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $partnerProgramId = $apiKey->partner_program_id ?? $apiKey->webmaster?->partner_program_id;
        app(PartnerProgramContext::class)->setPartnerProgramId($partnerProgramId);

        $validated = $request->validate([
            'offer_id' => ['required', 'exists:offers,id'],
            'geo' => ['nullable', 'string', 'max:4'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email'],
            'subid' => ['nullable', 'string', 'max:255'],
            'landing_url' => ['nullable', 'url'],
            'ip' => ['nullable', 'ip'],
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

        $leadIp = $validated['ip'] ?? $request->ip();
        $submittedGeo = isset($validated['geo']) ? strtoupper(trim((string) $validated['geo'])) : null;
        $submittedGeo = $submittedGeo === '' ? null : $submittedGeo;
        $detectedGeo = $this->geoIpResolver->resolveCountryCode($leadIp);

        $geo = $submittedGeo;
        if ($detectedGeo && ($geo === null || (bool) config('geoip.prefer_detected_geo', false))) {
            $geo = $detectedGeo;
        }

        if (! $geo) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => [
                    'geo' => ['The geo field is required when it cannot be detected from IP.'],
                ],
            ], 422);
        }

        $extraData = $validated['extra_data'] ?? null;
        if ((bool) config('geoip.attach_detected_geo_to_extra_data', true) && $detectedGeo) {
            $extraData = is_array($extraData) ? $extraData : [];
            $extraData['_detected_geo'] = $detectedGeo;
            if ($leadIp) {
                $extraData['_detected_geo_ip'] = $leadIp;
            }
            if ($submittedGeo) {
                $extraData['_submitted_geo'] = $submittedGeo;
            }
        }

        $lead = Lead::create([
            'partner_program_id' => $partnerProgramId,
            'offer_id' => $offer->id,
            'webmaster_id' => $apiKey->webmaster_id,
            'geo' => $geo,
            'status' => 'new',
            'payout' => null,
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'extra_data' => $extraData,
            'subid' => $validated['subid'] ?? null,
            'ip' => $leadIp,
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

        dispatch(new SendPostbacksJob($lead->id, null));

        return response()->json([
            'status' => 'ok',
            'lead_id' => $lead->id,
        ]);
    }
}
