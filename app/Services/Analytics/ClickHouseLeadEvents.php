<?php

namespace App\Services\Analytics;

use ClickHouseDB\Client;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

class ClickHouseLeadEvents
{
    private ?Client $client = null;

    public function isEnabled(): bool
    {
        return (bool) config('clickhouse.enabled', false);
    }

    public function setupSchema(): void
    {
        $client = $this->client();
        if (! $client) {
            throw new InvalidArgumentException('ClickHouse is disabled or unavailable.');
        }

        $database = $this->safeIdentifier((string) config('clickhouse.database'));
        $table = $this->safeIdentifier((string) config('clickhouse.table_lead_events'));
        $retentionMonths = max((int) config('clickhouse.retention_months', 24), 1);

        $client->write("CREATE DATABASE IF NOT EXISTS {$database}");
        $client->database($database);

        $client->write("
            CREATE TABLE IF NOT EXISTS {$database}.{$table} (
                event_time DateTime,
                event_date Date DEFAULT toDate(event_time),
                event_type LowCardinality(String),
                lead_id UInt64,
                partner_program_id UInt64,
                webmaster_id UInt64,
                offer_id UInt64,
                status LowCardinality(String),
                from_status Nullable(String),
                geo Nullable(String),
                payout Nullable(Decimal(12, 2)),
                subid Nullable(String),
                utm_source Nullable(String),
                utm_medium Nullable(String),
                utm_campaign Nullable(String),
                utm_term Nullable(String),
                utm_content Nullable(String),
                ip Nullable(String)
            )
            ENGINE = MergeTree
            PARTITION BY toYYYYMM(event_date)
            ORDER BY (partner_program_id, event_date, offer_id, webmaster_id, lead_id, event_time)
            TTL event_date + INTERVAL {$retentionMonths} MONTH DELETE
        ");
    }

    public function writeLeadEvent(array $event): void
    {
        $client = $this->client();
        if (! $client) {
            return;
        }

        $database = $this->safeIdentifier((string) config('clickhouse.database'));
        $table = $this->safeIdentifier((string) config('clickhouse.table_lead_events'));
        $client->database($database);

        $columns = [
            'event_time',
            'event_type',
            'lead_id',
            'partner_program_id',
            'webmaster_id',
            'offer_id',
            'status',
            'from_status',
            'geo',
            'payout',
            'subid',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            'ip',
        ];

        $values = [[
            $event['event_time'],
            $event['event_type'],
            $event['lead_id'],
            $event['partner_program_id'],
            $event['webmaster_id'],
            $event['offer_id'],
            $event['status'],
            $event['from_status'],
            $event['geo'],
            $event['payout'],
            $event['subid'],
            $event['utm_source'],
            $event['utm_medium'],
            $event['utm_campaign'],
            $event['utm_term'],
            $event['utm_content'],
            $event['ip'],
        ]];

        try {
            $client->insert($table, $values, $columns);
        } catch (Throwable $exception) {
            Log::warning('ClickHouse lead event insert failed', [
                'error' => $exception->getMessage(),
                'lead_id' => $event['lead_id'] ?? null,
                'event_type' => $event['event_type'] ?? null,
            ]);
        }
    }

    private function client(): ?Client
    {
        if (! $this->isEnabled()) {
            return null;
        }

        if ($this->client) {
            return $this->client;
        }

        try {
            $config = [
                'host' => (string) config('clickhouse.host'),
                'port' => (int) config('clickhouse.port', 8123),
                'username' => (string) config('clickhouse.username', 'default'),
                'password' => (string) config('clickhouse.password', ''),
            ];
            if ((bool) config('clickhouse.https', false)) {
                $config['https'] = true;
            }

            $client = new Client($config);
            $client->setTimeout((int) config('clickhouse.timeout', 10));
            $client->setConnectTimeOut((int) config('clickhouse.connect_timeout', 5));

            $database = (string) config('clickhouse.database', 'analytics');
            if ($database !== '') {
                $client->database($database);
            }

            $this->client = $client;

            return $this->client;
        } catch (Throwable $exception) {
            Log::warning('ClickHouse connection failed', ['error' => $exception->getMessage()]);

            return null;
        }
    }

    private function safeIdentifier(string $identifier): string
    {
        if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $identifier)) {
            throw new InvalidArgumentException("Unsafe ClickHouse identifier: {$identifier}");
        }

        return $identifier;
    }
}
