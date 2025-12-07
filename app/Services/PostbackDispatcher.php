<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\PostbackLog;
use App\Models\PostbackSetting;
use App\Support\PartnerProgramContext;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PostbackDispatcher
{
    private const ALLOWED_EVENTS = ['lead', 'in_work', 'sale', 'cancel', 'trash'];

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
                $statusCode = null;
                $responseBody = null;
                $error = null;
                $finalUrl = $this->expandPostbackMacros($setting->url, $lead, $event, $fromStatus);

                try {
                    $response = Http::timeout(5)->get($finalUrl);
                    $statusCode = $response->status();
                    $responseBody = Str::limit($response->body(), 4000);
                } catch (\Throwable $e) {
                    $error = $e->getMessage();
                }

                PostbackLog::create([
                    'partner_program_id' => $lead->partner_program_id,
                    'webmaster_id' => $lead->webmaster_id,
                    'lead_id' => $lead->id,
                    'offer_id' => $lead->offer_id,
                    'event' => $event,
                    'url' => $finalUrl,
                    'status_code' => $statusCode,
                    'response_body' => $responseBody,
                    'error_message' => $error,
                ]);
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
