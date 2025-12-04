<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_offer_category', function (Blueprint $table) {
            $table->foreignId('offer_id')->constrained('offers')->cascadeOnDelete();
            $table->foreignId('offer_category_id')->constrained('offer_categories')->cascadeOnDelete();
            $table->primary(['offer_id', 'offer_category_id']);
        });

        Schema::table('offer_webmaster_rates', function (Blueprint $table) {
            $table->boolean('is_allowed')->default(true)->after('custom_payout');
        });
    }

    public function down(): void
    {
        Schema::table('offer_webmaster_rates', function (Blueprint $table) {
            $table->dropColumn('is_allowed');
        });
        Schema::dropIfExists('offer_offer_category');
    }
};
