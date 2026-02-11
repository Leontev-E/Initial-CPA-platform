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
        Schema::create('smart_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_program_id')->constrained('partner_programs')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->boolean('is_active')->default(true);
            $table->foreignId('fallback_offer_id')->nullable()->constrained('offers')->nullOnDelete();
            $table->string('fallback_url', 2048)->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['partner_program_id', 'slug']);
            $table->index(['partner_program_id', 'is_active']);
        });

        Schema::create('smart_link_presets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_program_id')->constrained('partner_programs')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('default_weight')->default(100);
            $table->integer('default_priority')->default(0);
            $table->json('rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['partner_program_id', 'name']);
            $table->index(['partner_program_id', 'is_active']);
        });

        Schema::create('smart_link_streams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_program_id')->constrained('partner_programs')->cascadeOnDelete();
            $table->foreignId('smart_link_id')->constrained('smart_links')->cascadeOnDelete();
            $table->foreignId('offer_id')->nullable()->constrained('offers')->nullOnDelete();
            $table->foreignId('preset_id')->nullable()->constrained('smart_link_presets')->nullOnDelete();
            $table->string('name')->nullable();
            $table->unsignedInteger('weight')->default(100);
            $table->integer('priority')->default(0);
            $table->json('rules')->nullable();
            $table->string('target_url', 2048)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['smart_link_id', 'is_active', 'priority']);
            $table->index(['partner_program_id', 'offer_id']);
        });

        Schema::create('smart_link_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_program_id')->constrained('partner_programs')->cascadeOnDelete();
            $table->foreignId('smart_link_id')->nullable()->constrained('smart_links')->nullOnDelete();
            $table->foreignId('smart_link_stream_id')->nullable()->constrained('smart_link_streams')->nullOnDelete();
            $table->foreignId('offer_id')->nullable()->constrained('offers')->nullOnDelete();
            $table->uuid('click_id')->unique();
            $table->string('matched_by', 50)->nullable();
            $table->boolean('is_fallback')->default(false);
            $table->string('geo', 4)->nullable();
            $table->string('device_type', 20)->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('referer')->nullable();
            $table->string('host')->nullable();
            $table->string('path')->nullable();
            $table->text('target_url')->nullable();
            $table->json('query_params')->nullable();
            $table->string('subid')->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('utm_term')->nullable();
            $table->string('utm_content')->nullable();
            $table->timestamps();

            $table->index(['partner_program_id', 'created_at']);
            $table->index(['smart_link_id', 'created_at']);
            $table->index(['smart_link_stream_id', 'created_at']);
            $table->index(['offer_id', 'created_at']);
            $table->index('geo');
            $table->index('subid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('smart_link_clicks');
        Schema::dropIfExists('smart_link_streams');
        Schema::dropIfExists('smart_link_presets');
        Schema::dropIfExists('smart_links');
    }
};
