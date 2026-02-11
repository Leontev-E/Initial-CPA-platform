<?php

namespace App\Models;

use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SmartLinkAssignment extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'smart_link_id',
        'webmaster_id',
        'token',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $assignment): void {
            if (! $assignment->token) {
                $assignment->token = static::generateToken();
            }
        });
    }

    public static function generateToken(): string
    {
        return Str::lower(Str::random(40));
    }

    public function smartLink()
    {
        return $this->belongsTo(SmartLink::class);
    }

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }
}

