<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->boolean('is_private')->default(false)->after('is_active');
        });

        Schema::table('offer_webmaster_rates', function (Blueprint $table) {
            $table->unique(['offer_id', 'webmaster_id'], 'offer_webmaster_rates_offer_webmaster_unique');
        });
    }

    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn('is_private');
        });

        Schema::table('offer_webmaster_rates', function (Blueprint $table) {
            $table->dropUnique('offer_webmaster_rates_offer_webmaster_unique');
        });
    }
};
