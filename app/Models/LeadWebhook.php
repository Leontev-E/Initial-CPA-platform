<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class LeadWebhook extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'user_id',
        'name',
        'url',
        'method',
        'statuses',
        'fields',
        'is_active',
    ];

    protected $casts = [
        'statuses' => 'array',
        'fields' => 'array',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
