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
        'smart_link_assignment_id',
        'offer_id',
        'webmaster_id',
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
        'conversion_status',
        'conversion_payout',
        'conversion_revenue',
        'conversion_profit',
        'converted_at',
    ];

    protected $casts = [
        'is_fallback' => 'boolean',
        'query_params' => 'array',
        'conversion_payout' => 'decimal:2',
        'conversion_revenue' => 'decimal:2',
        'conversion_profit' => 'decimal:2',
        'converted_at' => 'datetime',
    ];

    public function smartLink()
    {
        return $this->belongsTo(SmartLink::class);
    }

    public function stream()
    {
        return $this->belongsTo(SmartLinkStream::class, 'smart_link_stream_id');
    }

    public function assignment()
    {
        return $this->belongsTo(SmartLinkAssignment::class, 'smart_link_assignment_id');
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }
}
