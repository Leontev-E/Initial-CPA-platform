<?php

namespace App\Http\Controllers;

use App\Services\Analytics\ClickHouseLeadEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class HealthController extends Controller
{
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function ready(ClickHouseLeadEvents $clickHouse): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'redis' => $this->checkRedis(),
            'clickhouse' => $this->checkClickHouse($clickHouse),
        ];

        $failed = collect($checks)->contains(fn ($result) => ($result['ok'] ?? false) !== true);

        return response()->json([
            'status' => $failed ? 'degraded' : 'ok',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $failed ? 503 : 200);
    }

    private function checkDatabase(): array
    {
        try {
            DB::select('SELECT 1');

            return ['ok' => true];
        } catch (Throwable $exception) {
            return ['ok' => false, 'error' => $exception->getMessage()];
        }
    }

    private function checkCache(): array
    {
        $key = 'health:cache:'.bin2hex(random_bytes(4));

        try {
            Cache::put($key, '1', now()->addSeconds(10));
            $value = Cache::get($key);
            Cache::forget($key);

            return ['ok' => $value === '1'];
        } catch (Throwable $exception) {
            return ['ok' => false, 'error' => $exception->getMessage()];
        }
    }

    private function checkRedis(): array
    {
        if ((string) config('queue.default') !== 'redis' && (string) config('cache.default') !== 'redis') {
            return ['ok' => true, 'skipped' => true];
        }

        try {
            $connection = (string) config('queue.connections.redis.connection', 'default');
            $pong = Redis::connection($connection)->ping();

            return ['ok' => $pong === true || str_contains(strtolower((string) $pong), 'pong')];
        } catch (Throwable $exception) {
            return ['ok' => false, 'error' => $exception->getMessage()];
        }
    }

    private function checkClickHouse(ClickHouseLeadEvents $clickHouse): array
    {
        if (! $clickHouse->isEnabled()) {
            return ['ok' => true, 'skipped' => true];
        }

        return ['ok' => $clickHouse->ping()];
    }
}
