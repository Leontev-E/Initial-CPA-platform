<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\Analytics\ClickHouseLeadEvents;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncLeadEventToClickHouseJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 20;

    public function __construct(
        public readonly int $leadId,
        public readonly string $eventType = 'created',
        public readonly ?string $fromStatus = null,
    ) {
    }

    public function handle(ClickHouseLeadEvents $clickHouse): void
    {
        if (! $clickHouse->isEnabled()) {
            return;
        }

        $lead = Lead::withoutGlobalScopes()->find($this->leadId);
        if (! $lead) {
            return;
        }

        $clickHouse->writeLeadEvent([
            'event_time' => optional($lead->updated_at ?? $lead->created_at)->format('Y-m-d H:i:s'),
            'event_type' => $this->eventType,
            'lead_id' => (int) $lead->id,
            'partner_program_id' => (int) ($lead->partner_program_id ?? 0),
            'webmaster_id' => (int) ($lead->webmaster_id ?? 0),
            'offer_id' => (int) ($lead->offer_id ?? 0),
            'status' => (string) ($lead->status ?? ''),
            'from_status' => $this->fromStatus,
            'geo' => $lead->geo,
            'payout' => $lead->payout !== null ? (string) $lead->payout : null,
            'subid' => $lead->subid,
            'utm_source' => $lead->utm_source,
            'utm_medium' => $lead->utm_medium,
            'utm_campaign' => $lead->utm_campaign,
            'utm_term' => $lead->utm_term,
            'utm_content' => $lead->utm_content,
            'ip' => $lead->ip,
        ]);
    }
}
