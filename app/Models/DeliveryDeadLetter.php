<?php

namespace App\Models;

use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Database\Eloquent\Model;

class DeliveryDeadLetter extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'lead_id',
        'type',
        'destination',
        'method',
        'url',
        'payload',
        'attempts',
        'last_status_code',
        'last_error',
        'next_retry_at',
        'resolved_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'next_retry_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];
}
