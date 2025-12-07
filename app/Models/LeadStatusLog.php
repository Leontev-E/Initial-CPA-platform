<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class LeadStatusLog extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
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
