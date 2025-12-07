<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_programs', function (Blueprint $table) {
            $table->unsignedInteger('offer_limit')->nullable()->default(15)->after('settings');
            $table->unsignedInteger('webmaster_limit')->nullable()->default(40)->after('offer_limit');
            $table->boolean('is_unlimited')->default(false)->after('webmaster_limit');
            $table->boolean('is_blocked')->default(false)->after('is_unlimited');
        });
    }

    public function down(): void
    {
        Schema::table('partner_programs', function (Blueprint $table) {
            $table->dropColumn(['offer_limit', 'webmaster_limit', 'is_unlimited', 'is_blocked']);
        });
    }
};
