<?php

namespace App\Models;

use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Database\Eloquent\Model;

class SmartLinkStream extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'smart_link_id',
        'offer_id',
        'preset_id',
        'name',
        'weight',
        'priority',
        'rules',
        'target_url',
        'is_active',
    ];

    protected $casts = [
        'weight' => 'integer',
        'priority' => 'integer',
        'rules' => 'array',
        'is_active' => 'boolean',
    ];

    public function smartLink()
    {
        return $this->belongsTo(SmartLink::class);
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function preset()
    {
        return $this->belongsTo(SmartLinkPreset::class, 'preset_id');
    }

    public function clicks()
    {
        return $this->hasMany(SmartLinkClick::class, 'smart_link_stream_id');
    }
}
