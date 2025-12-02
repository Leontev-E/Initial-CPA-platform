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
        Schema::create('postback_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webmaster_id')->constrained('users')->cascadeOnDelete();
            $table->enum('event', ['lead', 'sale', 'trash']);
            $table->string('url');
            $table->boolean('is_active')->default(true);
            $table->unique(['webmaster_id', 'event']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('postback_settings');
    }
};
