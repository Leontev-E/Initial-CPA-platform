<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('offer_webmaster_rates')) {
            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                Schema::table('offer_webmaster_rates', function (Blueprint $table) {
                    $table->decimal('custom_payout', 10, 2)->nullable()->change();
                });
            } else {
                // allow saving rows without custom payout
                DB::statement('ALTER TABLE offer_webmaster_rates ALTER COLUMN custom_payout DROP NOT NULL');
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('offer_webmaster_rates')) {
            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                Schema::table('offer_webmaster_rates', function (Blueprint $table) {
                    $table->decimal('custom_payout', 10, 2)->nullable(false)->change();
                });
            } else {
                DB::statement('ALTER TABLE offer_webmaster_rates ALTER COLUMN custom_payout SET NOT NULL');
            }
        }
    }
};
