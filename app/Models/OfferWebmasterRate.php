<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferWebmasterRate extends Model
{
    protected $fillable = [
        'offer_id',
        'webmaster_id',
        'custom_payout',
    ];

    protected $casts = [
        'custom_payout' => 'decimal:2',
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }
}
