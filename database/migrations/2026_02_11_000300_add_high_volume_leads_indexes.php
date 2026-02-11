<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->index(['partner_program_id', 'created_at'], 'leads_partner_program_created_at_idx');
            $table->index(['partner_program_id', 'status', 'created_at'], 'leads_partner_program_status_created_at_idx');
            $table->index(['partner_program_id', 'webmaster_id', 'created_at'], 'leads_partner_program_webmaster_created_at_idx');
            $table->index(['partner_program_id', 'offer_id', 'created_at'], 'leads_partner_program_offer_created_at_idx');
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement("CREATE INDEX IF NOT EXISTS leads_partner_program_sale_created_at_partial_idx ON leads (partner_program_id, webmaster_id, created_at DESC) WHERE status = 'sale'");
            DB::statement("CREATE INDEX IF NOT EXISTS leads_partner_program_cancel_trash_created_at_partial_idx ON leads (partner_program_id, webmaster_id, created_at DESC) WHERE status IN ('cancel', 'trash')");
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('leads_partner_program_created_at_idx');
            $table->dropIndex('leads_partner_program_status_created_at_idx');
            $table->dropIndex('leads_partner_program_webmaster_created_at_idx');
            $table->dropIndex('leads_partner_program_offer_created_at_idx');
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS leads_partner_program_sale_created_at_partial_idx');
            DB::statement('DROP INDEX IF EXISTS leads_partner_program_cancel_trash_created_at_partial_idx');
        }
    }
};
