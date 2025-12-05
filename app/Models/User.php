<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_WEBMASTER = 'webmaster';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'telegram',
        'note',
        'dashboard_message',
        'password',
        'role',
        'is_active',
        'last_login_at',
        'last_activity_at',
        'employee_role',
        'permissions',
        'invited_by',
        'min_payout',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'permissions' => 'array',
        ];
    }

    public function leads()
    {
        return $this->hasMany(Lead::class, 'webmaster_id');
    }

    public function apiKeys()
    {
        return $this->hasMany(ApiKey::class, 'webmaster_id');
    }

    public function postbackSettings()
    {
        return $this->hasMany(PostbackSetting::class, 'webmaster_id');
    }

    public function payoutRequests()
    {
        return $this->hasMany(PayoutRequest::class, 'webmaster_id');
    }

    public function rates()
    {
        return $this->hasMany(OfferWebmasterRate::class, 'webmaster_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isWebmaster(): bool
    {
        return $this->role === self::ROLE_WEBMASTER;
    }

    public function leadWebhooks()
    {
        return $this->hasMany(LeadWebhook::class);
    }

    public function canImpersonateWebmaster(): bool
    {
        if (! $this->isAdmin()) {
            return false;
        }

        // Владельцу всегда можно
        if ($this->invited_by === null) {
            return true;
        }

        return (bool) ($this->permissions['actions']['impersonate'] ?? false);
    }

    public function canImpersonateEmployee(): bool
    {
        // Только для администраторов ПП
        if (! $this->isAdmin()) {
            return false;
        }

        // Владельцу всегда можно
        if ($this->invited_by === null) {
            return true;
        }

        return (bool) ($this->permissions['actions']['impersonate_employee'] ?? false);
    }
}
