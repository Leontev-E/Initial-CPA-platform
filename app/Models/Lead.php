<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Jobs\SendLeadWebhooksJob;
use App\Models\Concerns\HasPartnerProgram;

class Lead extends Model
{
    use HasPartnerProgram;

    public ?string $fromStatusForWebhook = null;

    protected $fillable = [
        'partner_program_id',
        'offer_id',
        'webmaster_id',
        'geo',
        'status',
        'payout',
        'customer_name',
        'customer_phone',
        'customer_email',
        'shipping_address',
        'extra_data',
        'subid',
        'ip',
        'user_agent',
        'landing_url',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'tags',
        'comment',
    ];

    protected $casts = [
        'extra_data' => 'array',
        'tags' => 'array',
        'payout' => 'decimal:2',
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function webmaster()
    {
        return $this->belongsTo(User::class, 'webmaster_id');
    }

    public function statusLogs()
    {
        return $this->hasMany(LeadStatusLog::class);
    }

    protected static function booted()
    {
        static::created(function (Lead $lead) {
            dispatch(new SendLeadWebhooksJob($lead->id, null));
        });

        static::updating(function (Lead $lead) {
            $lead->fromStatusForWebhook = $lead->getOriginal('status');
        });

        static::updated(function (Lead $lead) {
            if ($lead->wasChanged('status')) {
                $fromStatus = $lead->fromStatusForWebhook ?? $lead->getOriginal('status');
                dispatch(new SendLeadWebhooksJob($lead->id, $fromStatus));
            }
        });
    }
}
