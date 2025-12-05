<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('postback_settings', function (Blueprint $table) {
            $table->string('event', 50)->change();
        });
    }

    public function down(): void
    {
        // оставляем строкой
    }
};