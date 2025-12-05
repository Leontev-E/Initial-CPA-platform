<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['sqlite', 'pgsql'], true)) {
            // На SQLite и Postgres оставляем строкой / текстом — ничего менять не нужно.
            return;
        }

        Schema::table('postback_settings', function (Blueprint $table) {
            $table->string('event', 50)->change();
        });
    }

    public function down(): void
    {
        // Откат не выполняем, оставляем event строкой.
        return;
    }
};
