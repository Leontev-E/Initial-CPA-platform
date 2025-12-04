<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    public function offersMany()
    {
        return $this->belongsToMany(Offer::class, 'offer_offer_category');
    }
}
