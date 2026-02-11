<?php

namespace App\Services\Analytics;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Throwable;

class ClickHouseLeadEventBuffer
{
    public function enqueue(array $event): void
    {
        $connection = (string) config('clickhouse.buffer.redis_connection', 'default');
        $key = (string) config('clickhouse.buffer.redis_key', 'clickhouse:lead_events:buffer');

        Redis::connection($connection)->rpush($key, json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    public function flush(ClickHouseLeadEvents $clickHouse, ?int $maxItems = null): int
    {
        $connection = (string) config('clickhouse.buffer.redis_connection', 'default');
        $key = (string) config('clickhouse.buffer.redis_key', 'clickhouse:lead_events:buffer');
        $batchSize = max((int) config('clickhouse.buffer.batch_size', 500), 1);
        $max = max((int) ($maxItems ?? config('clickhouse.buffer.max_flush_items', 5000)), 1);

        $processed = 0;
        $buffer = [];

        while ($processed < $max) {
            $raw = Redis::connection($connection)->lpop($key);
            if ($raw === null) {
                break;
            }

            $decoded = json_decode((string) $raw, true);
            if (! is_array($decoded)) {
                continue;
            }

            $buffer[] = $decoded;
            $processed++;

            if (count($buffer) >= $batchSize) {
                $this->flushChunk($clickHouse, $connection, $key, $buffer);
                $buffer = [];
            }
        }

        if ($buffer !== []) {
            $this->flushChunk($clickHouse, $connection, $key, $buffer);
        }

        return $processed;
    }

    private function flushChunk(ClickHouseLeadEvents $clickHouse, string $connection, string $key, array $events): void
    {
        try {
            $clickHouse->writeLeadEvents($events);
        } catch (Throwable $exception) {
            // Put back events to the head to avoid data loss on temporary CH outage.
            foreach (array_reverse($events) as $event) {
                Redis::connection($connection)->lpush(
                    $key,
                    json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                );
            }

            Log::warning('ClickHouse batch flush failed, events returned to buffer', [
                'error' => $exception->getMessage(),
                'count' => count($events),
            ]);
        }
    }
}
