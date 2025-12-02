<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
