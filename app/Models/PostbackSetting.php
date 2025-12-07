<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasPartnerProgram;

class PostbackSetting extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
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
