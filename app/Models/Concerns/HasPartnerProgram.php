<?php

namespace App\Models\Concerns;

use App\Models\PartnerProgram;
use App\Scopes\PartnerProgramScope;
use App\Support\PartnerProgramContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait HasPartnerProgram
{
    protected static function bootHasPartnerProgram(): void
    {
        static::addGlobalScope(new PartnerProgramScope());

        static::creating(function (Model $model) {
            if ($model->getAttribute('partner_program_id')) {
                return;
            }

            $contextId = app(PartnerProgramContext::class)->getPartnerProgramId();
            if ($contextId !== null) {
                $model->setAttribute('partner_program_id', $contextId);
            }
        });
    }

    public function partnerProgram()
    {
        return $this->belongsTo(PartnerProgram::class);
    }

    public function scopeForPartnerProgram(Builder $builder, int $partnerProgramId): Builder
    {
        return $builder->withoutGlobalScope(PartnerProgramScope::class)
            ->where($builder->qualifyColumn('partner_program_id'), $partnerProgramId);
    }

    public static function withoutPartnerProgramScope(): Builder
    {
        /** @var Builder $query */
        $query = static::query()->withoutGlobalScope(PartnerProgramScope::class);

        return $query;
    }
}
