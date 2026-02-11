<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class OutboundHttpDelivery
{
    /**
     * @return array{
     *   delivered: bool,
     *   status_code: int|null,
     *   response_body: string|null,
     *   error_message: string|null,
     *   attempt_count: int,
     *   latency_ms: int|null,
     *   circuit_open: bool
     * }
     */
    public function send(string $channel, string $method, string $url, array $payload = []): array
    {
        if ($this->isCircuitOpen($channel, $url)) {
            return [
                'delivered' => false,
                'status_code' => null,
                'response_body' => null,
                'error_message' => 'Circuit breaker is open for destination.',
                'attempt_count' => 0,
                'latency_ms' => null,
                'circuit_open' => true,
            ];
        }

        $maxAttempts = max((int) config('delivery.http.max_attempts', 3), 1);
        $retryableStatuses = config('delivery.http.retry_on_statuses', []);
        $backoff = config('delivery.http.backoff_ms', [300, 1000, 3000]);

        $attemptCount = 0;
        $statusCode = null;
        $responseBody = null;
        $errorMessage = null;
        $latencyMs = null;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $attemptCount = $attempt;
            $startedAt = microtime(true);

            try {
                $response = $this->performRequest($method, $url, $payload);
                $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);
                $statusCode = $response->status();
                $responseBody = Str::limit($response->body(), 4000);

                if ($response->successful()) {
                    $this->onSuccess($channel, $url);

                    return [
                        'delivered' => true,
                        'status_code' => $statusCode,
                        'response_body' => $responseBody,
                        'error_message' => null,
                        'attempt_count' => $attemptCount,
                        'latency_ms' => $latencyMs,
                        'circuit_open' => false,
                    ];
                }

                $errorMessage = sprintf('HTTP %d', $statusCode);

                if (! in_array($statusCode, $retryableStatuses, true) || $attempt === $maxAttempts) {
                    break;
                }
            } catch (Throwable $exception) {
                $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);
                $errorMessage = $exception->getMessage();
                if ($attempt === $maxAttempts) {
                    break;
                }
            }

            $sleepMs = (int) ($backoff[$attempt - 1] ?? end($backoff) ?: 0);
            if ($sleepMs > 0) {
                usleep($sleepMs * 1000);
            }
        }

        $this->onFailure($channel, $url);

        return [
            'delivered' => false,
            'status_code' => $statusCode,
            'response_body' => $responseBody,
            'error_message' => $errorMessage,
            'attempt_count' => $attemptCount,
            'latency_ms' => $latencyMs,
            'circuit_open' => false,
        ];
    }

    private function performRequest(string $method, string $url, array $payload): Response
    {
        $pending = Http::connectTimeout((int) config('delivery.http.connect_timeout', 5))
            ->timeout((int) config('delivery.http.timeout', 15));

        return match (strtolower($method)) {
            'post' => $pending->asForm()->post($url, $payload),
            'get' => $pending->get($url, $payload),
            default => $pending->send(strtoupper($method), $url, ['query' => $payload]),
        };
    }

    private function isCircuitOpen(string $channel, string $url): bool
    {
        if (! (bool) config('delivery.circuit_breaker.enabled', true)) {
            return false;
        }

        $openKey = $this->openKey($channel, $url);

        return (bool) Cache::get($openKey, false);
    }

    private function onSuccess(string $channel, string $url): void
    {
        if (! (bool) config('delivery.circuit_breaker.enabled', true)) {
            return;
        }

        Cache::forget($this->openKey($channel, $url));
        Cache::forget($this->failKey($channel, $url));
    }

    private function onFailure(string $channel, string $url): void
    {
        if (! (bool) config('delivery.circuit_breaker.enabled', true)) {
            return;
        }

        $failKey = $this->failKey($channel, $url);
        $window = max((int) config('delivery.circuit_breaker.rolling_window_seconds', 300), 30);
        $threshold = max((int) config('delivery.circuit_breaker.failure_threshold', 5), 1);
        $cooldown = max((int) config('delivery.circuit_breaker.cooldown_seconds', 120), 30);

        $count = (int) Cache::get($failKey, 0) + 1;
        Cache::put($failKey, $count, now()->addSeconds($window));

        if ($count >= $threshold) {
            Cache::put($this->openKey($channel, $url), true, now()->addSeconds($cooldown));
            Cache::forget($failKey);
        }
    }

    private function failKey(string $channel, string $url): string
    {
        return 'delivery:fail:'.$channel.':'.sha1($url);
    }

    private function openKey(string $channel, string $url): string
    {
        return 'delivery:open:'.$channel.':'.sha1($url);
    }
}
