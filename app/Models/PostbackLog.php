<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostbackLog extends Model
{
    protected $fillable = [
        'webmaster_id',
        'lead_id',
        'event',
        'url',
        'status_code',
        'response_body',
        'error_message',
    ];
}
