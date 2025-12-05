<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('postback_logs', function (Blueprint ) {
            ->bigIncrements('id');
            ->unsignedBigInteger('webmaster_id');
            ->unsignedBigInteger('lead_id')->nullable();
            ->string('event', 50);
            ->text('url');
            ->integer('status_code')->nullable();
            ->text('response_body')->nullable();
            ->text('error_message')->nullable();
            ->timestamps();

            ->index('webmaster_id');
            ->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('postback_logs');
    }
};