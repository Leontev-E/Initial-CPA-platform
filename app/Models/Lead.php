<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'offer_id',
        'webmaster_id',
        'geo',
        'status',
        'payout',
        'customer_name',
        'customer_phone',
        'customer_email',
        'extra_data',
        'subid',
        'ip',
        'user_agent',
        'landing_url',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'tags',
    ];

    protected $casts = [
        'extra_data' => 'array',
        'tags' => 'array',
        'payout' => 'decimal:2',
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }

    public function statusLogs()
    {
        return $this->hasMany(LeadStatusLog::class);
    }
}
