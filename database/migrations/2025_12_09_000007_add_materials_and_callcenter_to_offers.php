<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->string('materials_link')->nullable()->after('image_path');
            $table->string('call_center_hours')->nullable()->after('materials_link');
            $table->string('call_center_timezone')->nullable()->after('call_center_hours'); // 'local' или 'msk'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn(['materials_link', 'call_center_hours', 'call_center_timezone']);
        });
    }
};
