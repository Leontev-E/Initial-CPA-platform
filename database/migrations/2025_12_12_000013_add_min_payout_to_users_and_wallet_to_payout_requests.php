<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('min_payout', 10, 2)->default(0)->after('permissions');
        });

        Schema::table('payout_requests', function (Blueprint $table) {
            $table->string('wallet_address', 255)->nullable()->after('method');
        });
    }

    public function down(): void
    {
        Schema::table('payout_requests', function (Blueprint $table) {
            $table->dropColumn('wallet_address');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('min_payout');
        });
    }
};
