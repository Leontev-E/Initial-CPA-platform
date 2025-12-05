<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE postback_settings MODIFY COLUMN event VARCHAR(50) NOT NULL");
        }
        // sqlite stores as TEXT already; nothing to do.
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE postback_settings MODIFY COLUMN event ENUM('lead','in_work','sale','cancel','trash') NOT NULL");
        }
    }
};