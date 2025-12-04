<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Offer extends Model
{
    protected $fillable = [
        'offer_category_id',
        'name',
        'slug',
        'default_payout',
        'allowed_geos',
        'description',
        'notes',
        'image_path',
        'is_active',
    ];

    protected $casts = [
        'allowed_geos' => 'array',
        'default_payout' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = ['image_url', 'created_at_human'];

    public function category()
    {
        return $this->belongsTo(OfferCategory::class, 'offer_category_id');
    }

    public function rates()
    {
        return $this->hasMany(OfferWebmasterRate::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::url($this->image_path) : null;
    }

    public function getCreatedAtHumanAttribute(): ?string
    {
        return $this->created_at?->format('d.m.Y');
    }
}
