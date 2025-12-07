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
        'offer_limit',
        'webmaster_limit',
        'is_unlimited',
        'is_blocked',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_unlimited' => 'boolean',
        'is_blocked' => 'boolean',
    ];

    public function scopeActive(Builder $builder): Builder
    {
        return $builder->where('status', 'active');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    public function webmasters(): HasMany
    {
        return $this->hasMany(User::class)->where('role', User::ROLE_WEBMASTER);
    }
}
