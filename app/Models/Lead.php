<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\LeadWebhook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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
        $this->loadMissing('offer');
        $webhooks = LeadWebhook::query()->where('is_active', true)->get();
        foreach ($webhooks as $hook) {
            if (!empty($hook->statuses) && !in_array($this->status, $hook->statuses, true)) {
                continue;
            }

            $payload = $this->buildPayload($hook->fields);
            $url = $this->expandMacros($hook->url, $payload);
            if ($hook->method === 'get') {
                Http::timeout(10)->get($url, $payload);
            } else {
                Http::timeout(10)->asForm()->post($url, $payload);
            }
        }
    }

    protected function buildPayload(?array $fields): array
    {
        $this->loadMissing('offer');
        $base = [
            'id' => $this->id,
            'status' => $this->status,
            'offer_id' => $this->offer_id,
            'offer_name' => $this->offer?->name,
            'webmaster_id' => $this->webmaster_id,
            'created_at' => optional($this->created_at)->toIso8601String(),
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

    protected function expandMacros(string $template, array $payload): string
    {
        $replacements = [];
        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
            $replacements['{'.$key.'}'] = $value;
        }

        return strtr($template, $replacements);
    }
}
