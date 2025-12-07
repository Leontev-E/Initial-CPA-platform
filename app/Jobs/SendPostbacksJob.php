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

    public int $timeout = 20;

    public function __construct(
        public int $leadId,
        public ?string $fromStatus = null
    ) {
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
