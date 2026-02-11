<?php

namespace App\Console\Commands;

use App\Models\DeliveryDeadLetter;
use App\Services\OutboundHttpDelivery;
use Illuminate\Console\Command;

class DeliveryRetryDeadLettersCommand extends Command
{
    protected $signature = 'delivery:retry-dead-letters {--limit= : Max number of rows to process}';

    protected $description = 'Retry failed outbound deliveries stored in DLQ';

    public function handle(OutboundHttpDelivery $delivery): int
    {
        if (! (bool) config('delivery.dlq.enabled', true)) {
            $this->warn('DLQ is disabled.');

            return self::SUCCESS;
        }

        $limit = max((int) ($this->option('limit') ?: config('delivery.dlq.batch_size', 200)), 1);
        $maxAttempts = max((int) config('delivery.dlq.max_attempts', 10), 1);
        $delayMinutes = max((int) config('delivery.dlq.retry_delay_minutes', 15), 1);

        $rows = DeliveryDeadLetter::query()
            ->whereNull('resolved_at')
            ->where(function ($query) {
                $query->whereNull('next_retry_at')->orWhere('next_retry_at', '<=', now());
            })
            ->where('attempts', '<', $maxAttempts)
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $processed = 0;
        $resolved = 0;

        foreach ($rows as $row) {
            $processed++;

            $result = $delivery->send(
                channel: $row->type,
                method: $row->method ?: 'get',
                url: (string) $row->url,
                payload: is_array($row->payload) ? $row->payload : []
            );

            if ($result['delivered']) {
                $row->update([
                    'attempts' => $row->attempts + max((int) $result['attempt_count'], 1),
                    'last_status_code' => $result['status_code'],
                    'last_error' => null,
                    'resolved_at' => now(),
                    'next_retry_at' => null,
                ]);
                $resolved++;

                continue;
            }

            $row->update([
                'attempts' => $row->attempts + max((int) $result['attempt_count'], 1),
                'last_status_code' => $result['status_code'],
                'last_error' => $result['error_message'],
                'next_retry_at' => now()->addMinutes($delayMinutes),
            ]);
        }

        $this->info(sprintf('Processed %d dead letters, resolved %d.', $processed, $resolved));

        return self::SUCCESS;
    }
}
