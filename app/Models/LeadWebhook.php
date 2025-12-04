<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadWebhook extends Model
{
    protected $fillable = [
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
