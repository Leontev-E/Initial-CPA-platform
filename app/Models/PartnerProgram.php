<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class PartnerProgram extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'contact_email',
        'status',
        'domain',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function scopeActive(Builder $builder): Builder
    {
        return $builder->where('status', 'active');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
