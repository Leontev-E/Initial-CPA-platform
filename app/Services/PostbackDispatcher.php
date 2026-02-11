<?php

namespace App\Services;

use App\Models\DeliveryDeadLetter;
use App\Models\Lead;
use App\Models\PostbackLog;
use App\Models\PostbackSetting;
use App\Support\PartnerProgramContext;
use Illuminate\Support\Str;

class PostbackDispatcher
{
    private const ALLOWED_EVENTS = ['lead', 'in_work', 'sale', 'cancel', 'trash'];

    public function __construct(private readonly OutboundHttpDelivery $delivery)
    {
    }

    public function dispatch(Lead $lead, ?string $fromStatus = null): void
    {
        $context = app(PartnerProgramContext::class);
        $previousContextId = $context->getPartnerProgramId();
        $context->setPartnerProgramId($lead->partner_program_id);

        $lead->loadMissing('offer');
        $event = $this->eventForStatus($lead->status);
        if (! in_array($event, self::ALLOWED_EVENTS, true)) {
            $context->setPartnerProgramId($previousContextId);
            return;
        }

        try {
            $settings = PostbackSetting::where('webmaster_id', $lead->webmaster_id)
                ->where('event', $event)
                ->where('is_active', true)
                ->get();

            foreach ($settings as $setting) {
                $finalUrl = $this->expandPostbackMacros($setting->url, $lead, $event, $fromStatus);
                $result = $this->delivery->send('postback', 'get', $finalUrl);

                PostbackLog::create([
                    'partner_program_id' => $lead->partner_program_id,
                    'webmaster_id' => $lead->webmaster_id,
                    'lead_id' => $lead->id,
                    'offer_id' => $lead->offer_id,
                    'event' => $event,
                    'url' => $finalUrl,
                    'status_code' => $result['status_code'],
                    'attempt_count' => $result['attempt_count'],
                    'latency_ms' => $result['latency_ms'],
                    'response_body' => $result['response_body'] !== null ? Str::limit($result['response_body'], 4000) : null,
                    'error_message' => $result['error_message'],
                ]);

                if (! $result['delivered'] && (bool) config('delivery.dlq.enabled', true)) {
                    DeliveryDeadLetter::create([
                        'partner_program_id' => $lead->partner_program_id,
                        'lead_id' => $lead->id,
                        'type' => 'postback',
                        'destination' => $finalUrl,
                        'method' => 'get',
                        'url' => $finalUrl,
                        'payload' => null,
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

    private function eventForStatus(string $status): string
    {
        return match ($status) {
            'sale' => 'sale',
            'cancel' => 'cancel',
            'trash' => 'trash',
            'in_work' => 'in_work',
            default => 'lead',
        };
    }

    private function expandPostbackMacros(string $template, Lead $lead, string $event, ?string $fromStatus = null): string
    {
        $payload = [
            '{lead_id}' => $lead->id,
            '{status}' => $lead->status,
            '{event}' => $event,
            '{from}' => $fromStatus ?? '',
            '{from_status}' => $fromStatus ?? '',
            '{payout}' => $lead->payout,
            '{offer_id}' => $lead->offer_id,
            '{offer_name}' => $lead->offer?->name,
            '{subid}' => $lead->subid,
            '{geo}' => $lead->geo,
            '{landing_url}' => $lead->landing_url,
            '{customer_name}' => $lead->customer_name,
            '{customer_phone}' => $lead->customer_phone,
            '{customer_email}' => $lead->customer_email,
            '{shipping_address}' => $lead->shipping_address,
            '{customer_address}' => $lead->shipping_address,
            '{webmaster_id}' => $lead->webmaster_id,
        ];

        return strtr($template, $payload);
    }
}
