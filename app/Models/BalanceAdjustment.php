<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class BalanceAdjustment extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'webmaster_id',
        'created_by',
        'amount',
        'comment',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
