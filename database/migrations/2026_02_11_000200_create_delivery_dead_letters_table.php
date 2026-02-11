<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_dead_letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_program_id')->nullable()->constrained('partner_programs')->nullOnDelete();
            $table->unsignedBigInteger('lead_id')->nullable()->index();
            $table->string('type', 32)->index(); // postback|webhook|clickhouse
            $table->string('destination', 255)->nullable();
            $table->string('method', 10)->nullable();
            $table->text('url')->nullable();
            $table->json('payload')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->integer('last_status_code')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('next_retry_at')->nullable()->index();
            $table->timestamp('resolved_at')->nullable()->index();
            $table->timestamps();

            $table->index(['type', 'created_at']);
            $table->index(['partner_program_id', 'resolved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_dead_letters');
    }
};
