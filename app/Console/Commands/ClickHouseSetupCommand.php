<?php

namespace App\Console\Commands;

use App\Services\Analytics\ClickHouseLeadEvents;
use Illuminate\Console\Command;
use Throwable;

class ClickHouseSetupCommand extends Command
{
    protected $signature = 'clickhouse:setup {--force : Run even if CLICKHOUSE_ENABLED=false}';

    protected $description = 'Create ClickHouse database and analytics tables';

    public function handle(ClickHouseLeadEvents $clickHouse): int
    {
        if (! $clickHouse->isEnabled() && ! $this->option('force')) {
            $this->warn('ClickHouse is disabled. Set CLICKHOUSE_ENABLED=true or use --force.');

            return self::SUCCESS;
        }

        try {
            $clickHouse->setupSchema();
            $this->info('ClickHouse schema is ready.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('ClickHouse setup failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
