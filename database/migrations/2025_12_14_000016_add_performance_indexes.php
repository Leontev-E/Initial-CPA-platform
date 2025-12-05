<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->index(['webmaster_id', 'status', 'created_at'], 'leads_webmaster_status_created_at_idx');
            $table->index(['offer_id', 'status', 'created_at'], 'leads_offer_status_created_at_idx');
        });

        Schema::table('payout_requests', function (Blueprint $table) {
            $table->index(['webmaster_id', 'status', 'created_at'], 'payout_requests_webmaster_status_created_at_idx');
        });

        Schema::table('postback_logs', function (Blueprint $table) {
            $table->index(['webmaster_id', 'created_at'], 'postback_logs_webmaster_created_at_idx');
        });

        Schema::table('lead_webhook_logs', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'lead_webhook_logs_user_created_at_idx');
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            // Ускоряем поиск по allowed_geos (json) для фильтрации офферов
            DB::statement('CREATE INDEX IF NOT EXISTS offers_allowed_geos_gin ON offers USING GIN ((allowed_geos::jsonb));');
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('leads_webmaster_status_created_at_idx');
            $table->dropIndex('leads_offer_status_created_at_idx');
        });

        Schema::table('payout_requests', function (Blueprint $table) {
            $table->dropIndex('payout_requests_webmaster_status_created_at_idx');
        });

        Schema::table('postback_logs', function (Blueprint $table) {
            $table->dropIndex('postback_logs_webmaster_created_at_idx');
        });

        Schema::table('lead_webhook_logs', function (Blueprint $table) {
            $table->dropIndex('lead_webhook_logs_user_created_at_idx');
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS offers_allowed_geos_gin;');
        }
    }
};
