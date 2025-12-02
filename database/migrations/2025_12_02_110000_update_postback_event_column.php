<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Переводим колонку event в VARCHAR для поддержки дополнительных статусов
        DB::statement("ALTER TABLE postback_settings MODIFY event VARCHAR(32) NOT NULL");
    }

    public function down(): void
    {
        // При откате оставляем как есть (enum назад не возвращаем)
    }
};
