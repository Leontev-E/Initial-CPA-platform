<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_role')->nullable()->after('role');
            $table->json('permissions')->nullable()->after('employee_role');
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete()->after('permissions');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('invited_by');
            $table->dropColumn(['employee_role', 'permissions']);
        });
    }
};
