<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\Analytics\ClickHouseLeadEventBuffer;
use App\Services\Analytics\ClickHouseLeadEvents;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

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
        $this->queue = 'clickhouse';
    }

    public function backoff(): array
    {
        return [5, 20, 60];
    }

    public function handle(ClickHouseLeadEvents $clickHouse, ClickHouseLeadEventBuffer $buffer): void
    {
        if (! $clickHouse->isEnabled()) {
            return;
        }

        $lead = Lead::withoutGlobalScopes()->find($this->leadId);
        if (! $lead) {
            return;
        }

        $event = [
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
        ];

        try {
            $buffer->enqueue($event);
        } catch (Throwable $exception) {
            Log::warning('Failed to enqueue ClickHouse event, writing directly', [
                'lead_id' => $this->leadId,
                'event_type' => $this->eventType,
                'error' => $exception->getMessage(),
            ]);

            $clickHouse->writeLeadEvent($event);
        }
    }
}
