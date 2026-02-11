<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStatusLog;
use App\Models\SmartLink;
use App\Models\SmartLinkClick;
use App\Models\SmartLinkPostbackLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class SmartLinkPostbackController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:120'],
            'click_id' => ['required', 'string', 'max:64'],
            'status' => ['nullable', 'string', 'max:50'],
            'payout' => ['nullable', 'numeric'],
            'revenue' => ['nullable', 'numeric'],
            'geo' => ['nullable', 'string', 'max:4'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $smartLink = SmartLink::query()
            ->where('postback_token', (string) $validated['token'])
            ->first();

        if (! $smartLink) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid postback token.',
            ], 401);
        }

        $click = SmartLinkClick::query()
            ->where('smart_link_id', $smartLink->id)
            ->where('click_id', (string) $validated['click_id'])
            ->first();

        $normalizedStatus = $this->normalizeStatus((string) ($validated['status'] ?? 'sale'));
        $payout = Arr::has($validated, 'payout') ? (float) $validated['payout'] : null;
        $revenue = Arr::has($validated, 'revenue') ? (float) $validated['revenue'] : null;
        $profit = ($payout !== null && $revenue !== null) ? ($revenue - $payout) : null;

        $lead = null;
        $processed = false;
        $error = null;

        DB::transaction(function () use (
            $request,
            $smartLink,
            $click,
            $validated,
            $normalizedStatus,
            $payout,
            $revenue,
            $profit,
            &$lead,
            &$processed,
            &$error
        ): void {
            if (! $click) {
                $error = 'Unknown click_id for this smart link.';
                return;
            }

            $click->update([
                'conversion_status' => $normalizedStatus,
                'conversion_payout' => $payout,
                'conversion_revenue' => $revenue,
                'conversion_profit' => $profit,
                'converted_at' => now(),
            ]);

            $lead = $this->upsertLeadFromPostback(
                smartLink: $smartLink,
                click: $click,
                status: $normalizedStatus,
                payout: $payout,
                revenue: $revenue,
                geoOverride: isset($validated['geo']) ? strtoupper((string) $validated['geo']) : null,
                comment: $validated['comment'] ?? null,
            );

            $processed = true;

            SmartLinkPostbackLog::create([
                'partner_program_id' => $smartLink->partner_program_id,
                'smart_link_id' => $smartLink->id,
                'smart_link_click_id' => $click->id,
                'webmaster_id' => $click->webmaster_id,
                'offer_id' => $click->offer_id,
                'lead_id' => $lead?->id,
                'click_id' => $click->click_id,
                'status' => $normalizedStatus,
                'payout' => $payout,
                'revenue' => $revenue,
                'profit' => $profit,
                'processed' => true,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'payload' => $request->all(),
            ]);
        });

        if (! $processed) {
            SmartLinkPostbackLog::create([
                'partner_program_id' => $smartLink->partner_program_id,
                'smart_link_id' => $smartLink->id,
                'smart_link_click_id' => $click?->id,
                'webmaster_id' => $click?->webmaster_id,
                'offer_id' => $click?->offer_id,
                'click_id' => $validated['click_id'],
                'status' => $normalizedStatus,
                'payout' => $payout,
                'revenue' => $revenue,
                'profit' => $profit,
                'processed' => false,
                'error_message' => $error ?? 'Unable to process postback.',
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'payload' => $request->all(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $error ?? 'Unable to process postback.',
            ], 404);
        }

        return response()->json([
            'status' => 'ok',
            'processed' => true,
            'click_id' => $validated['click_id'],
            'lead_id' => $lead?->id,
            'lead_status' => $lead?->status,
        ]);
    }

    private function upsertLeadFromPostback(
        SmartLink $smartLink,
        SmartLinkClick $click,
        string $status,
        ?float $payout,
        ?float $revenue,
        ?string $geoOverride,
        ?string $comment
    ): ?Lead {
        if (! $click->webmaster_id || ! $click->offer_id) {
            return null;
        }

        $idempotency = hash('sha256', implode('|', [
            'smartlink-postback',
            $smartLink->id,
            $click->click_id,
        ]));

        $lead = Lead::query()
            ->where('partner_program_id', $smartLink->partner_program_id)
            ->where('webmaster_id', $click->webmaster_id)
            ->where('offer_id', $click->offer_id)
            ->where(function ($q) use ($click, $idempotency) {
                $q->where('idempotency_key', $idempotency)
                    ->orWhere('subid', $click->click_id);
            })
            ->latest('id')
            ->first();

        $extraData = [];
        if ($lead && is_array($lead->extra_data)) {
            $extraData = $lead->extra_data;
        }

        if ($revenue !== null) {
            $extraData['_advertiser_revenue'] = $revenue;
        }
        $extraData['_smart_link_click_id'] = $click->id;
        $extraData['_smart_link_id'] = $smartLink->id;

        if (! $lead) {
            $lead = Lead::create([
                'partner_program_id' => $smartLink->partner_program_id,
                'offer_id' => $click->offer_id,
                'webmaster_id' => $click->webmaster_id,
                'geo' => $geoOverride ?: ($click->geo ?: 'ZZ'),
                'status' => $status,
                'payout' => $this->statusPayout($status, $payout),
                'customer_name' => 'SmartLink Conversion',
                'customer_phone' => 'n/a',
                'customer_email' => null,
                'extra_data' => $extraData,
                'subid' => $click->click_id,
                'idempotency_key' => $idempotency,
                'ip' => $click->ip,
                'user_agent' => $click->user_agent,
                'landing_url' => $click->target_url,
                'utm_source' => $click->utm_source,
                'utm_medium' => $click->utm_medium,
                'utm_campaign' => $click->utm_campaign,
                'utm_term' => $click->utm_term,
                'utm_content' => $click->utm_content,
            ]);

            LeadStatusLog::create([
                'partner_program_id' => $smartLink->partner_program_id,
                'lead_id' => $lead->id,
                'user_id' => null,
                'from_status' => null,
                'to_status' => $lead->status,
                'comment' => $comment ?: 'Created by SmartLink postback',
            ]);

            return $lead;
        }

        $fromStatus = $lead->status;
        $lead->status = $status;
        $lead->payout = $this->statusPayout($status, $payout, $lead->payout);
        $lead->geo = $geoOverride ?: ($lead->geo ?: $click->geo ?: 'ZZ');
        $lead->extra_data = $extraData;
        $lead->save();

        if ($fromStatus !== $lead->status) {
            LeadStatusLog::create([
                'partner_program_id' => $smartLink->partner_program_id,
                'lead_id' => $lead->id,
                'user_id' => null,
                'from_status' => $fromStatus,
                'to_status' => $lead->status,
                'comment' => $comment ?: 'Updated by SmartLink postback',
            ]);
        }

        return $lead;
    }

    private function statusPayout(string $status, ?float $providedPayout, float|string|null $existing = null): ?float
    {
        if (in_array($status, ['cancel', 'trash'], true)) {
            return 0.0;
        }

        if ($providedPayout !== null) {
            return $providedPayout;
        }

        if ($status === 'sale') {
            return $existing !== null ? (float) $existing : 0.0;
        }

        return $existing !== null ? (float) $existing : null;
    }

    private function normalizeStatus(string $status): string
    {
        $value = strtolower(trim($status));

        return match ($value) {
            'approved', 'approve', 'sale', 'success', 'confirmed' => 'sale',
            'inwork', 'in_work', 'processing' => 'in_work',
            'rejected', 'declined', 'cancel', 'canceled' => 'cancel',
            'trash', 'hold', 'fraud' => 'trash',
            default => 'new',
        };
    }
}

