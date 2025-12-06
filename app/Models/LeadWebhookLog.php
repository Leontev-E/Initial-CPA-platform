<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadWebhookLog extends Model
{
    protected $fillable = [
        'webhook_id',
        'user_id',
        'lead_id',
        'offer_id',
        'event',
        'method',
        'url',
        'status_code',
        'response_body',
        'error_message',
        'direction',
        'status_before',
        'status_after',
        'payload',
        'ip',
        'user_agent',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function webhook()
    {
        return $this->belongsTo(LeadWebhook::class, 'webhook_id');
    }
}
