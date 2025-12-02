<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostbackSetting extends Model
{
    protected $fillable = [
        'webmaster_id',
        'event',
        'url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }
}
