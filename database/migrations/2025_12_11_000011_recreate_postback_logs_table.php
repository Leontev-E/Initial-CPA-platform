<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('postback_logs')) {
            $this->createTable();
            return;
        }

        Schema::dropIfExists('postback_logs_tmp');
        $this->createTable('postback_logs_tmp');

        $rows = DB::table('postback_logs')->get();
        foreach ($rows as $row) {
            DB::table('postback_logs_tmp')->insert([
                'id' => $row->id ?? null,
                'webmaster_id' => $row->webmaster_id ?? null,
                'lead_id' => $row->lead_id ?? null,
                'offer_id' => $row->offer_id ?? null,
                'event' => $row->event ?? '',
                'url' => $row->url ?? '',
                'status_code' => $row->status_code ?? null,
                'response_body' => $row->response_body ?? null,
                'error_message' => $row->error_message ?? null,
                'created_at' => $row->created_at ?? null,
                'updated_at' => $row->updated_at ?? null,
            ]);
        }

        Schema::disableForeignKeyConstraints();
        Schema::drop('postback_logs');
        Schema::rename('postback_logs_tmp', 'postback_logs');
        Schema::enableForeignKeyConstraints();
    }

    private function createTable(string $name = 'postback_logs'): void
    {
        Schema::create($name, function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('webmaster_id');
            $table->unsignedBigInteger('lead_id')->nullable();
            $table->unsignedBigInteger('offer_id')->nullable();
            $table->string('event', 50);
            $table->text('url');
            $table->integer('status_code')->nullable();
            $table->text('response_body')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('webmaster_id');
            $table->index('lead_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        // не откатываем, таблица приведена к корректной структуре
    }
};
