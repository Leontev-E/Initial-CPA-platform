<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('partner_programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('contact_email')->nullable();
            $table->string('status', 50)->default('active');
            $table->string('domain')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        // Default program for existing data
        DB::table('partner_programs')->insert([
            'id' => 1,
            'name' => 'Default CPA',
            'slug' => 'default-cpa',
            'contact_email' => config('mail.from.address'),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('partner_program_id')
                ->nullable()
                ->after('id')
                ->constrained('partner_programs')
                ->nullOnDelete();
        });

        $this->addTenantColumn('offers', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->unique(['partner_program_id', 'slug']);
        });

        $this->addTenantColumn('offer_categories', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->unique(['partner_program_id', 'slug']);
        });

        $this->addTenantColumn('offer_landings');
        $this->addTenantColumn('offer_webmaster_rates', function (Blueprint $table) {
            $table->dropUnique(['offer_id', 'webmaster_id']);
            $table->unique(['partner_program_id', 'offer_id', 'webmaster_id'], 'offer_webmaster_rates_unique');
        });

        $this->addTenantColumn('leads', callback: function (Blueprint $table) {
            $table->index(['partner_program_id', 'webmaster_id']);
            $table->index(['partner_program_id', 'offer_id']);
        });
        $this->addTenantColumn('lead_status_logs');
        $this->addTenantColumn('api_keys', function (Blueprint $table) {
            $table->index(['partner_program_id', 'webmaster_id']);
        });
        $this->addTenantColumn('postback_settings', function (Blueprint $table) {
            $table->index(['partner_program_id', 'webmaster_id']);
        });
        $this->addTenantColumn('postback_logs', function (Blueprint $table) {
            $table->index(['partner_program_id', 'webmaster_id']);
        });
        $this->addTenantColumn('payout_requests', function (Blueprint $table) {
            $table->index(['partner_program_id', 'webmaster_id']);
        });
        $this->addTenantColumn('balance_adjustments', function (Blueprint $table) {
            $table->index(['partner_program_id', 'webmaster_id']);
            $table->index(['partner_program_id', 'created_by']);
        });
        $this->addTenantColumn('lead_webhooks');
        $this->addTenantColumn('lead_webhook_logs');

        // Backfill existing rows with the default program
        $tables = [
            'users', 'offers', 'offer_categories', 'offer_landings', 'offer_webmaster_rates',
            'leads', 'lead_status_logs', 'api_keys', 'postback_settings', 'postback_logs',
            'payout_requests', 'balance_adjustments', 'lead_webhooks', 'lead_webhook_logs',
        ];

        foreach ($tables as $table) {
            DB::table($table)->whereNull('partner_program_id')->update(['partner_program_id' => 1]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offer_webmaster_rates', function (Blueprint $table) {
            $table->dropUnique('offer_webmaster_rates_unique');
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->dropUnique(['partner_program_id', 'slug']);
            $table->unique('slug');
        });

        Schema::table('offer_categories', function (Blueprint $table) {
            $table->dropUnique(['partner_program_id', 'slug']);
            $table->unique('slug');
        });

        foreach ([
            'lead_webhook_logs',
            'lead_webhooks',
            'balance_adjustments',
            'payout_requests',
            'postback_logs',
            'postback_settings',
            'api_keys',
            'lead_status_logs',
            'leads',
            'offer_webmaster_rates',
            'offer_landings',
            'offer_categories',
            'offers',
            'users',
        ] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'partner_program_id')) {
                    $table->dropConstrainedForeignId('partner_program_id');
                }
            });
        }

        Schema::dropIfExists('partner_programs');
    }

    /**
     * Add partner_program_id column with FK and optional extra schema changes.
     */
    protected function addTenantColumn(string $tableName, ?callable $callback = null): void
    {
        Schema::table($tableName, function (Blueprint $table) {
            $table->foreignId('partner_program_id')
                ->after('id')
                ->default(1)
                ->constrained('partner_programs')
                ->cascadeOnDelete();
        });

        if ($callback) {
            Schema::table($tableName, $callback);
        }
    }
};
