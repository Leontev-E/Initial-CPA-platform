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
        'is_public',
        'fallback_offer_id',
        'fallback_url',
        'postback_token',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_public' => 'boolean',
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

    public function assignments()
    {
        return $this->hasMany(SmartLinkAssignment::class);
    }

    public function webmasters()
    {
        return $this->belongsToMany(User::class, 'smart_link_assignments', 'smart_link_id', 'webmaster_id')
            ->withPivot(['id', 'token', 'is_active'])
            ->withTimestamps();
    }

    public function postbackLogs()
    {
        return $this->hasMany(SmartLinkPostbackLog::class);
    }

    public function fallbackOffer()
    {
        return $this->belongsTo(Offer::class, 'fallback_offer_id');
    }
}
