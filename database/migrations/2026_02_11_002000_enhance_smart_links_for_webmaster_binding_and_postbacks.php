<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('smart_links', function (Blueprint $table) {
            if (! Schema::hasColumn('smart_links', 'is_public')) {
                $table->boolean('is_public')->default(true)->after('is_active');
            }

            if (! Schema::hasColumn('smart_links', 'postback_token')) {
                $table->string('postback_token', 80)->nullable()->after('fallback_url');
            }
        });

        if (! $this->hasUniqueIndex('smart_links', 'smart_links_postback_token_unique')) {
            Schema::table('smart_links', function (Blueprint $table) {
                $table->unique('postback_token', 'smart_links_postback_token_unique');
            });
        }

        if (! Schema::hasTable('smart_link_assignments')) {
            Schema::create('smart_link_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('partner_program_id')->constrained('partner_programs')->cascadeOnDelete();
                $table->foreignId('smart_link_id')->constrained('smart_links')->cascadeOnDelete();
                $table->foreignId('webmaster_id')->constrained('users')->cascadeOnDelete();
                $table->string('token', 80)->unique();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['smart_link_id', 'webmaster_id'], 'smart_link_assignments_unique');
                $table->index(['partner_program_id', 'webmaster_id'], 'smart_link_assignments_partner_webmaster_idx');
            });
        }

        if (! Schema::hasTable('smart_link_postback_logs')) {
            Schema::create('smart_link_postback_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('partner_program_id')->constrained('partner_programs')->cascadeOnDelete();
                $table->foreignId('smart_link_id')->constrained('smart_links')->cascadeOnDelete();
                $table->foreignId('smart_link_click_id')->nullable()->constrained('smart_link_clicks')->nullOnDelete();
                $table->foreignId('webmaster_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('offer_id')->nullable()->constrained('offers')->nullOnDelete();
                $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
                $table->string('click_id', 64)->nullable();
                $table->string('status', 50)->nullable();
                $table->decimal('payout', 12, 2)->nullable();
                $table->decimal('revenue', 12, 2)->nullable();
                $table->decimal('profit', 12, 2)->nullable();
                $table->boolean('processed')->default(false);
                $table->text('error_message')->nullable();
                $table->string('ip', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->json('payload')->nullable();
                $table->timestamps();

                $table->index(['partner_program_id', 'created_at'], 'smart_link_postbacks_partner_created_idx');
                $table->index(['smart_link_id', 'created_at'], 'smart_link_postbacks_link_created_idx');
                $table->index(['click_id'], 'smart_link_postbacks_click_id_idx');
            });
        }

        Schema::table('smart_link_clicks', function (Blueprint $table) {
            if (! Schema::hasColumn('smart_link_clicks', 'webmaster_id')) {
                $table->foreignId('webmaster_id')->nullable()->after('offer_id')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('smart_link_clicks', 'smart_link_assignment_id')) {
                $table->foreignId('smart_link_assignment_id')
                    ->nullable()
                    ->after('smart_link_stream_id')
                    ->constrained('smart_link_assignments')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('smart_link_clicks', 'conversion_status')) {
                $table->string('conversion_status', 50)->nullable()->after('utm_content');
            }

            if (! Schema::hasColumn('smart_link_clicks', 'conversion_payout')) {
                $table->decimal('conversion_payout', 12, 2)->nullable()->after('conversion_status');
            }

            if (! Schema::hasColumn('smart_link_clicks', 'conversion_revenue')) {
                $table->decimal('conversion_revenue', 12, 2)->nullable()->after('conversion_payout');
            }

            if (! Schema::hasColumn('smart_link_clicks', 'conversion_profit')) {
                $table->decimal('conversion_profit', 12, 2)->nullable()->after('conversion_revenue');
            }

            if (! Schema::hasColumn('smart_link_clicks', 'converted_at')) {
                $table->timestamp('converted_at')->nullable()->after('conversion_profit');
            }
        });

        if (! $this->hasIndex('smart_link_clicks', 'smart_link_clicks_webmaster_created_idx')) {
            Schema::table('smart_link_clicks', function (Blueprint $table) {
                $table->index(['webmaster_id', 'created_at'], 'smart_link_clicks_webmaster_created_idx');
            });
        }

        if (! $this->hasIndex('smart_link_clicks', 'smart_link_clicks_converted_at_idx')) {
            Schema::table('smart_link_clicks', function (Blueprint $table) {
                $table->index(['converted_at'], 'smart_link_clicks_converted_at_idx');
            });
        }

        DB::table('smart_links')
            ->whereNull('postback_token')
            ->orderBy('id')
            ->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    DB::table('smart_links')
                        ->where('id', $row->id)
                        ->whereNull('postback_token')
                        ->update([
                            'postback_token' => Str::lower(Str::random(48)),
                        ]);
                }
            });
    }

    public function down(): void
    {
        if ($this->hasIndex('smart_link_clicks', 'smart_link_clicks_converted_at_idx')) {
            Schema::table('smart_link_clicks', function (Blueprint $table) {
                $table->dropIndex('smart_link_clicks_converted_at_idx');
            });
        }

        if ($this->hasIndex('smart_link_clicks', 'smart_link_clicks_webmaster_created_idx')) {
            Schema::table('smart_link_clicks', function (Blueprint $table) {
                $table->dropIndex('smart_link_clicks_webmaster_created_idx');
            });
        }

        Schema::table('smart_link_clicks', function (Blueprint $table) {
            foreach ([
                'converted_at',
                'conversion_profit',
                'conversion_revenue',
                'conversion_payout',
                'conversion_status',
            ] as $column) {
                if (Schema::hasColumn('smart_link_clicks', $column)) {
                    $table->dropColumn($column);
                }
            }

            if (Schema::hasColumn('smart_link_clicks', 'smart_link_assignment_id')) {
                $table->dropConstrainedForeignId('smart_link_assignment_id');
            }

            if (Schema::hasColumn('smart_link_clicks', 'webmaster_id')) {
                $table->dropConstrainedForeignId('webmaster_id');
            }
        });

        Schema::dropIfExists('smart_link_postback_logs');
        Schema::dropIfExists('smart_link_assignments');

        if ($this->hasUniqueIndex('smart_links', 'smart_links_postback_token_unique')) {
            Schema::table('smart_links', function (Blueprint $table) {
                $table->dropUnique('smart_links_postback_token_unique');
            });
        }

        Schema::table('smart_links', function (Blueprint $table) {
            if (Schema::hasColumn('smart_links', 'postback_token')) {
                $table->dropColumn('postback_token');
            }
            if (Schema::hasColumn('smart_links', 'is_public')) {
                $table->dropColumn('is_public');
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            return collect(DB::select('PRAGMA index_list('.DB::getPdo()->quote($table).')'))
                ->contains(fn ($row) => ($row->name ?? null) === $index);
        }

        return $this->hasInformationSchemaIndex($table, $index);
    }

    private function hasUniqueIndex(string $table, string $index): bool
    {
        return $this->hasIndex($table, $index);
    }

    private function hasInformationSchemaIndex(string $table, string $index): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return false;
        }

        if ($driver === 'pgsql') {
            $result = DB::selectOne(
                'select 1 from pg_indexes where schemaname = current_schema() and tablename = ? and indexname = ? limit 1',
                [$table, $index]
            );

            return $result !== null;
        }

        $database = DB::getDatabaseName();
        $result = DB::selectOne(
            'select 1 from information_schema.statistics where table_schema = ? and table_name = ? and index_name = ? limit 1',
            [$database, $table, $index]
        );

        return $result !== null;
    }
};
