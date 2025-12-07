<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class LeadWebhookLog extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
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
