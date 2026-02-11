<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class PostbackLog extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'webmaster_id',
        'lead_id',
        'offer_id',
        'event',
        'url',
        'status_code',
        'attempt_count',
        'latency_ms',
        'response_body',
        'error_message',
    ];
}
