<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'idempotency_key')) {
                $table->string('idempotency_key', 64)->nullable()->after('subid');
            }

            $table->unique(
                ['partner_program_id', 'webmaster_id', 'offer_id', 'idempotency_key'],
                'leads_idempotency_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropUnique('leads_idempotency_unique');

            if (Schema::hasColumn('leads', 'idempotency_key')) {
                $table->dropColumn('idempotency_key');
            }
        });
    }
};
