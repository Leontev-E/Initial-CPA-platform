<?php

namespace App\Scopes;

use App\Support\PartnerProgramContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class PartnerProgramScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $contextId = app(PartnerProgramContext::class)->getPartnerProgramId();

        if ($contextId === null) {
            return;
        }

        $builder->where($model->qualifyColumn('partner_program_id'), $contextId);
    }
}
