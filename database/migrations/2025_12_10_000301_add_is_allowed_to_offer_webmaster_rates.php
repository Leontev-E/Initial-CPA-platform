<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offer_webmaster_rates', function (Blueprint $table) {
            if (!Schema::hasColumn('offer_webmaster_rates', 'is_allowed')) {
                $table->boolean('is_allowed')->default(true)->after('custom_payout');
            }
        });
    }

    public function down(): void
    {
        Schema::table('offer_webmaster_rates', function (Blueprint $table) {
            if (Schema::hasColumn('offer_webmaster_rates', 'is_allowed')) {
                $table->dropColumn('is_allowed');
            }
        });
    }
};
