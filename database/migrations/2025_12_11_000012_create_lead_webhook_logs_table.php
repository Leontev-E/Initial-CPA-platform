<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_webhook_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('webhook_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('lead_id')->nullable();
            $table->unsignedBigInteger('offer_id')->nullable();
            $table->string('event', 50);
            $table->string('method', 10)->default('post');
            $table->text('url');
            $table->integer('status_code')->nullable();
            $table->text('response_body')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('webhook_id');
            $table->index('user_id');
            $table->index('lead_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_webhook_logs');
    }
};
