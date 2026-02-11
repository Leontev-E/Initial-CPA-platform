<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\PostbackDispatcher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPostbacksJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $timeout = 20;

    public function __construct(
        public int $leadId,
        public ?string $fromStatus = null
    ) {
    }

    public function backoff(): array
    {
        return [5, 15, 60, 180];
    }

    public function handle(PostbackDispatcher $dispatcher): void
    {
        $lead = Lead::with('offer')->find($this->leadId);

        if (! $lead) {
            return;
        }

        $dispatcher->dispatch($lead, $this->fromStatus);
    }
}
