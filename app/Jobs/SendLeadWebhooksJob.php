<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\LeadWebhookDispatcher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendLeadWebhooksJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $timeout = 30;

    public function __construct(
        public int $leadId,
        public ?string $fromStatus = null
    ) {
        $this->queue = 'webhooks';
    }

    public function backoff(): array
    {
        return [10, 30, 90, 300];
    }

    public function handle(LeadWebhookDispatcher $dispatcher): void
    {
        $lead = Lead::with('offer')->find($this->leadId);

        if (! $lead) {
            return;
        }

        $dispatcher->dispatch($lead, $this->fromStatus);
    }
}
