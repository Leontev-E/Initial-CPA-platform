<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadWebhook;
use App\Models\LeadWebhookLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class LeadWebhookDispatcher
{
    public function dispatch(Lead $lead, ?string $fromStatus = null): void
    {
        $lead->loadMissing('offer');

        $webhooks = LeadWebhook::query()
            ->where('is_active', true)
            ->get();

        foreach ($webhooks as $hook) {
            if (! empty($hook->statuses) && ! in_array($lead->status, $hook->statuses, true)) {
                continue;
            }

            $payload = $this->buildPayload($lead, $hook->fields, $fromStatus);
            $expandedUrl = $this->expandMacros($hook->url, $payload);
            $method = strtolower($hook->method ?? 'post');

            $statusCode = null;
            $responseBody = null;
            $error = null;

            try {
                if ($method === 'get') {
                    $response = Http::timeout(10)->get($expandedUrl, $payload);
                } else {
                    $response = Http::timeout(10)->asForm()->post($expandedUrl, $payload);
                }

                $statusCode = $response->status();
                $responseBody = Str::limit($response->body(), 4000);
            } catch (\Throwable $e) {
                $error = $e->getMessage();
            }

            LeadWebhookLog::create([
                'webhook_id' => $hook->id,
                'user_id' => $hook->user_id,
                'lead_id' => $lead->id,
                'offer_id' => $lead->offer_id,
                'event' => $lead->status,
                'status_before' => $fromStatus,
                'status_after' => $lead->status,
                'method' => $method,
                'url' => $expandedUrl,
                'status_code' => $statusCode,
                'response_body' => $responseBody,
                'error_message' => $error,
                'direction' => 'outgoing',
            ]);
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
