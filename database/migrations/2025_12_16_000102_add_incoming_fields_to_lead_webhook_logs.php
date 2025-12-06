<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_webhook_logs', function (Blueprint $table) {
            $table->string('direction', 20)->default('outgoing')->index();
            $table->string('status_before', 50)->nullable();
            $table->string('status_after', 50)->nullable();
            $table->json('payload')->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();
        });

        if (Schema::hasColumn('lead_webhook_logs', 'direction')) {
            DB::table('lead_webhook_logs')->update(['direction' => 'outgoing']);
        }
    }

    public function down(): void
    {
        Schema::table('lead_webhook_logs', function (Blueprint $table) {
            $table->dropIndex('lead_webhook_logs_direction_index');
            $table->dropColumn([
                'direction',
                'status_before',
                'status_after',
                'payload',
                'ip',
                'user_agent',
            ]);
        });
    }
};
