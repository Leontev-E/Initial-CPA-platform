<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class OfferWebmasterRate extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
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
