<?php

namespace App\Console\Commands;

use App\Services\Analytics\ClickHouseLeadEventBuffer;
use App\Services\Analytics\ClickHouseLeadEvents;
use Illuminate\Console\Command;
use Throwable;

class ClickHouseFlushLeadEventsCommand extends Command
{
    protected $signature = 'clickhouse:flush-lead-events {--max= : Max number of buffered events to flush}';

    protected $description = 'Flush buffered lead events from Redis to ClickHouse in batches';

    public function handle(ClickHouseLeadEvents $clickHouse, ClickHouseLeadEventBuffer $buffer): int
    {
        if (! $clickHouse->isEnabled()) {
            $this->warn('ClickHouse is disabled.');

            return self::SUCCESS;
        }

        $max = (int) ($this->option('max') ?: config('clickhouse.buffer.max_flush_items', 5000));

        try {
            $count = $buffer->flush($clickHouse, $max);
            $this->info("Flushed {$count} lead events.");

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('Flush failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
