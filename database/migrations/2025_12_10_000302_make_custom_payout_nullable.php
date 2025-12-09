<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('offer_webmaster_rates')) {
            // allow saving rows without custom payout
            DB::statement('ALTER TABLE offer_webmaster_rates ALTER COLUMN custom_payout DROP NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('offer_webmaster_rates')) {
            DB::statement('ALTER TABLE offer_webmaster_rates ALTER COLUMN custom_payout SET NOT NULL');
        }
    }
};
