<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('postback_settings_tmp');

        Schema::create('postback_settings_tmp', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webmaster_id')->constrained('users')->cascadeOnDelete();
            $table->string('event', 50);
            $table->string('url', 2000);
            $table->boolean('is_active')->default(true);
            $table->unique(['webmaster_id', 'event']);
            $table->timestamps();
        });

        if (Schema::hasTable('postback_settings')) {
            $existing = DB::table('postback_settings')->get();

            foreach ($existing as $row) {
                DB::table('postback_settings_tmp')->insert([
                    'id' => $row->id,
                    'webmaster_id' => $row->webmaster_id,
                    'event' => $row->event,
                    'url' => $row->url,
                    'is_active' => (bool) $row->is_active,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }

            Schema::disableForeignKeyConstraints();
            Schema::drop('postback_settings');
            Schema::enableForeignKeyConstraints();
        }

        Schema::rename('postback_settings_tmp', 'postback_settings');
    }

    public function down(): void
    {
        // Оставляем event и url строковыми полями расширенной длины.
    }
};
