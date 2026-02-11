<?php

namespace App\Models;

use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Database\Eloquent\Model;

class SmartLinkPreset extends Model
{
    use HasPartnerProgram;

    protected $fillable = [
        'partner_program_id',
        'name',
        'description',
        'default_weight',
        'default_priority',
        'rules',
        'is_active',
    ];

    protected $casts = [
        'default_weight' => 'integer',
        'default_priority' => 'integer',
        'rules' => 'array',
        'is_active' => 'boolean',
    ];

    public function streams()
    {
        return $this->hasMany(SmartLinkStream::class, 'preset_id');
    }
}
