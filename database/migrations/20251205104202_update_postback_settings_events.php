<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // SQLite хранит enum как TEXT, менять не требуется.
            return;
        }

        DB::statement("ALTER TABLE postback_settings MODIFY COLUMN event ENUM('lead','in_work','sale','cancel','trash') NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE postback_settings MODIFY COLUMN event ENUM('lead','sale','trash') NOT NULL");
    }
};
