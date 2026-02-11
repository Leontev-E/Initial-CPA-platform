<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('postback_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('postback_logs', 'attempt_count')) {
                $table->unsignedInteger('attempt_count')->default(1)->after('status_code');
            }
            if (! Schema::hasColumn('postback_logs', 'latency_ms')) {
                $table->unsignedInteger('latency_ms')->nullable()->after('attempt_count');
            }
        });

        Schema::table('lead_webhook_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('lead_webhook_logs', 'attempt_count')) {
                $table->unsignedInteger('attempt_count')->default(1)->after('status_code');
            }
            if (! Schema::hasColumn('lead_webhook_logs', 'latency_ms')) {
                $table->unsignedInteger('latency_ms')->nullable()->after('attempt_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('postback_logs', function (Blueprint $table) {
            if (Schema::hasColumn('postback_logs', 'latency_ms')) {
                $table->dropColumn('latency_ms');
            }
            if (Schema::hasColumn('postback_logs', 'attempt_count')) {
                $table->dropColumn('attempt_count');
            }
        });

        Schema::table('lead_webhook_logs', function (Blueprint $table) {
            if (Schema::hasColumn('lead_webhook_logs', 'latency_ms')) {
                $table->dropColumn('latency_ms');
            }
            if (Schema::hasColumn('lead_webhook_logs', 'attempt_count')) {
                $table->dropColumn('attempt_count');
            }
        });
    }
};
