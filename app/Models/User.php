<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\HasPartnerProgram;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasPartnerProgram;

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_PARTNER_ADMIN = 'admin';
    public const ROLE_ADMIN = self::ROLE_PARTNER_ADMIN; // Backward compatible alias
    public const ROLE_WEBMASTER = 'webmaster';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'partner_program_id',
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
        'incoming_webhook_token',
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

    /**
     * Normalize legacy role values on read/write (e.g. partner_admin -> admin).
     */
    protected function role(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === 'partner_admin' ? self::ROLE_ADMIN : $value,
            set: fn ($value) => $value === 'partner_admin' ? self::ROLE_ADMIN : $value,
        );
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
        return $this->isPartnerAdmin();
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isPartnerAdmin(): bool
    {
        return $this->role === self::ROLE_PARTNER_ADMIN;
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
        if (! $this->isAdmin() && ! $this->isSuperAdmin()) {
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
        if (! $this->isAdmin() && ! $this->isSuperAdmin()) {
            return false;
        }

        // Владельцу всегда можно
        if ($this->invited_by === null) {
            return true;
        }

        return (bool) ($this->permissions['actions']['impersonate_employee'] ?? false);
    }
}
