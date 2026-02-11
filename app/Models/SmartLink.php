<?php

namespace App\Models;

use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Database\Eloquent\Model;

class SmartLink extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'name',
        'slug',
        'is_active',
        'fallback_offer_id',
        'fallback_url',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function streams()
    {
        return $this->hasMany(SmartLinkStream::class);
    }

    public function clicks()
    {
        return $this->hasMany(SmartLinkClick::class);
    }

    public function fallbackOffer()
    {
        return $this->belongsTo(Offer::class, 'fallback_offer_id');
    }
}
