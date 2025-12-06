<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('leads')) {
            return;
        }

        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'shipping_address')) {
                $table->string('shipping_address')->nullable();
            }

            if (! Schema::hasColumn('leads', 'comment')) {
                $table->text('comment')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('leads')) {
            return;
        }

        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'comment')) {
                $table->dropColumn('comment');
            }

            if (Schema::hasColumn('leads', 'shipping_address')) {
                $table->dropColumn('shipping_address');
            }
        });
    }
};
