<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::create('postback_settings_tmp', function (Blueprint ) {
                ->id();
                ->foreignId('webmaster_id')->constrained('users')->cascadeOnDelete();
                ->string('event', 50);
                ->string('url');
                ->boolean('is_active')->default(true);
                ->timestamps();
                ->unique(['webmaster_id', 'event']);
            });

            DB::table('postback_settings')->orderBy('id')->lazy()->each(function () {
                DB::table('postback_settings_tmp')->insert([
                    'id' => ->id,
                    'webmaster_id' => ->webmaster_id,
                    'event' => ->event,
                    'url' => ->url,
                    'is_active' => ->is_active,
                    'created_at' => ->created_at,
                    'updated_at' => ->updated_at,
                ]);
            });

            Schema::drop('postback_settings');
            Schema::rename('postback_settings_tmp', 'postback_settings');
        } else {
            Schema::table('postback_settings', function (Blueprint ) {
                ->string('event', 50)->change();
            });
        }
    }

    public function down(): void
    {
        // No-op: оставляем event строкой
    }
};