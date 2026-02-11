<?php

namespace App\Models;

use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Database\Eloquent\Model;

class SmartLinkPostbackLog extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'smart_link_id',
        'smart_link_click_id',
        'webmaster_id',
        'offer_id',
        'lead_id',
        'click_id',
        'status',
        'payout',
        'revenue',
        'profit',
        'processed',
        'error_message',
        'ip',
        'user_agent',
        'payload',
    ];

    protected $casts = [
        'processed' => 'boolean',
        'payload' => 'array',
        'payout' => 'decimal:2',
        'revenue' => 'decimal:2',
        'profit' => 'decimal:2',
    ];

    public function smartLink()
    {
        return $this->belongsTo(SmartLink::class);
    }

    public function click()
    {
        return $this->belongsTo(SmartLinkClick::class, 'smart_link_click_id');
    }

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}

