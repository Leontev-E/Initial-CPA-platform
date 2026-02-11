<?php

namespace App\Models;

use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Database\Eloquent\Model;

class SmartLinkClick extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'smart_link_id',
        'smart_link_stream_id',
        'offer_id',
        'click_id',
        'matched_by',
        'is_fallback',
        'geo',
        'device_type',
        'ip',
        'user_agent',
        'referer',
        'host',
        'path',
        'target_url',
        'query_params',
        'subid',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
    ];

    protected $casts = [
        'is_fallback' => 'boolean',
        'query_params' => 'array',
    ];

    public function smartLink()
    {
        return $this->belongsTo(SmartLink::class);
    }

    public function stream()
    {
        return $this->belongsTo(SmartLinkStream::class, 'smart_link_stream_id');
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }
}
