<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadStatusLog extends Model
{
    protected $fillable = [
        'lead_id',
        'user_id',
        'from_status',
        'to_status',
        'comment',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
