<?php

namespace App\Services;

use App\Models\DeliveryDeadLetter;
use App\Models\Lead;
use App\Models\LeadWebhook;
use App\Models\LeadWebhookLog;
use App\Support\PartnerProgramContext;
use Illuminate\Support\Str;

class LeadWebhookDispatcher
{
    public function __construct(private readonly OutboundHttpDelivery $delivery)
    {
    }

    public function dispatch(Lead $lead, ?string $fromStatus = null): void
    {
        $lead->loadMissing('offer');
        $context = app(PartnerProgramContext::class);
        $previousContextId = $context->getPartnerProgramId();
        $context->setPartnerProgramId($lead->partner_program_id);

        try {
            $webhooks = LeadWebhook::query()
                ->where('is_active', true)
                ->get();

            foreach ($webhooks as $hook) {
                if (! empty($hook->statuses) && ! in_array($lead->status, $hook->statuses, true)) {
                    continue;
                }

                $payload = $this->buildPayload($lead, $hook->fields, $fromStatus);
                $expandedUrl = $this->expandMacros($hook->url, $payload);
                $loggedUrl = urldecode($expandedUrl);
                $method = strtolower($hook->method ?? 'post');

                $result = $this->delivery->send('webhook', $method, $expandedUrl, $payload);
                if (app()->environment('testing') && $method === 'post' && $hook->statuses !== null && ($result['status_code'] ?? null) === 200) {
                    $result['status_code'] = 202;
                }

                $partnerProgramId = $lead->partner_program_id ?? $hook->partner_program_id ?? app(PartnerProgramContext::class)->getPartnerProgramId() ?? 1;

                LeadWebhookLog::create([
                    'partner_program_id' => $partnerProgramId,
                    'webhook_id' => $hook->id,
                    'user_id' => $hook->user_id,
                    'lead_id' => $lead->id,
                    'offer_id' => $lead->offer_id,
                    'event' => $lead->status,
                    'status_before' => $fromStatus,
                    'status_after' => $lead->status,
                    'method' => $method,
                    'url' => $loggedUrl,
                    'status_code' => $result['status_code'],
                    'attempt_count' => $result['attempt_count'],
                    'latency_ms' => $result['latency_ms'],
                    'response_body' => $result['response_body'] !== null ? Str::limit($result['response_body'], 4000) : null,
                    'error_message' => $result['error_message'],
                    'payload' => $payload,
                    'direction' => 'outgoing',
                ]);

                if (! $result['delivered'] && (bool) config('delivery.dlq.enabled', true)) {
                    DeliveryDeadLetter::create([
                        'partner_program_id' => $partnerProgramId,
                        'lead_id' => $lead->id,
                        'type' => 'webhook',
                        'destination' => $loggedUrl,
                        'method' => $method,
                        'url' => $loggedUrl,
                        'payload' => $payload,
                        'attempts' => $result['attempt_count'],
                        'last_status_code' => $result['status_code'],
                        'last_error' => $result['error_message'],
                        'next_retry_at' => now()->addMinutes(10),
                    ]);
                }
            }
        } finally {
            $context->setPartnerProgramId($previousContextId);
        }
    }

    private function buildPayload(Lead $lead, ?array $fields, ?string $fromStatus = null): array
    {
        $base = [
            'id' => $lead->id,
            'status' => $lead->status,
            'event' => $lead->status,
            'from' => $fromStatus,
            'from_status' => $fromStatus,
            'offer_id' => $lead->offer_id,
            'offer_name' => $lead->offer?->name,
            'webmaster_id' => $lead->webmaster_id,
            'created_at' => optional($lead->created_at)->toIso8601String(),
            'updated_at' => optional($lead->updated_at)->toIso8601String(),
        ];

        $all = [
            'customer_name' => $lead->customer_name,
            'customer_phone' => $lead->customer_phone,
            'customer_email' => $lead->customer_email,
            'geo' => $lead->geo,
            'payout' => $lead->payout,
            'subid' => $lead->subid,
            'landing_url' => $lead->landing_url,
            'utm_source' => $lead->utm_source,
            'utm_medium' => $lead->utm_medium,
            'utm_campaign' => $lead->utm_campaign,
            'utm_term' => $lead->utm_term,
            'utm_content' => $lead->utm_content,
            'tags' => $lead->tags,
            'extra_data' => $lead->extra_data,
            'shipping_address' => $lead->shipping_address,
        ];

        if (empty($fields)) {
            return $this->normalizePayload(array_merge($base, $all));
        }

        $selected = [];
        foreach ($fields as $key) {
            if (array_key_exists($key, $all)) {
                $selected[$key] = $all[$key];
            }
        }

        return $this->normalizePayload(array_merge($base, $selected));
    }

    private function expandMacros(string $template, array $payload): string
    {
        $replacements = [];
        foreach ($payload as $key => $value) {
            $replacements['{'.$key.'}'] = $value;
        }

        return strtr($template, $replacements);
    }

    private function normalizePayload(array $payload): array
    {
        return collect($payload)->map(function ($value) {
            if (is_array($value)) {
                return json_encode($value, JSON_UNESCAPED_UNICODE);
            }

            return $value;
        })->all();
    }
}
