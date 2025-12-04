<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\LeadWebhook;
use Illuminate\Support\Facades\Http;

class Lead extends Model
{
    protected $fillable = [
        'offer_id',
        'webmaster_id',
        'geo',
        'status',
        'payout',
        'customer_name',
        'customer_phone',
        'customer_email',
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
            $lead->dispatchWebhooks();
        });

        static::updated(function (Lead $lead) {
            if ($lead->isDirty('status')) {
                $lead->dispatchWebhooks();
            }
        });
    }

    protected function dispatchWebhooks(): void
    {
        $webhooks = LeadWebhook::query()->where('is_active', true)->get();
        foreach ($webhooks as $hook) {
            if (!empty($hook->statuses) && !in_array($this->status, $hook->statuses, true)) {
                continue;
            }

            $payload = $this->buildPayload($hook->fields);
            Http::timeout(10)->asJson()->post($hook->url, $payload);
        }
    }

    protected function buildPayload(?array $fields): array
    {
        $base = [
            'id' => $this->id,
            'status' => $this->status,
            'offer_id' => $this->offer_id,
            'webmaster_id' => $this->webmaster_id,
            'created_at' => $this->created_at,
        ];

        $all = [
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_email' => $this->customer_email,
            'geo' => $this->geo,
            'payout' => $this->payout,
            'subid' => $this->subid,
            'landing_url' => $this->landing_url,
            'utm_source' => $this->utm_source,
            'utm_medium' => $this->utm_medium,
            'utm_campaign' => $this->utm_campaign,
            'utm_term' => $this->utm_term,
            'utm_content' => $this->utm_content,
            'tags' => $this->tags,
            'extra_data' => $this->extra_data,
        ];

        if (empty($fields)) {
            return array_merge($base, $all);
        }

        $filtered = [];
        foreach ($fields as $key) {
            if (array_key_exists($key, $all)) {
                $filtered[$key] = $all[$key];
            }
        }

        return array_merge($base, $filtered);
    }
}
