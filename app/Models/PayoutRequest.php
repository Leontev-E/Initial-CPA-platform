<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class PayoutRequest extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'webmaster_id',
        'amount',
        'status',
        'method',
        'wallet_address',
        'public_comment',
        'internal_comment',
        'details',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }
}
