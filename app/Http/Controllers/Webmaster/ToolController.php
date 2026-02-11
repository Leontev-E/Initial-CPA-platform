<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Offer;
use App\Models\PostbackLog;
use App\Models\PostbackSetting;
use App\Models\SmartLink;
use App\Models\SmartLinkAssignment;
use App\Models\SmartLinkClick;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ToolController extends Controller
{
    private array $allowedEvents = ['lead', 'in_work', 'sale', 'cancel', 'trash'];

    public function index(Request $request)
    {
        $user = $request->user();
        $apiKey = ApiKey::firstOrCreate(
            ['webmaster_id' => $user->id, 'is_active' => true],
            ['key' => Str::uuid()->toString(), 'partner_program_id' => $user->partner_program_id]
        );

        $postbacks = PostbackSetting::where('webmaster_id', $user->id)
            ->whereIn('event', $this->allowedEvents)
            ->get()
            ->map(fn($pb) => [
                'event' => $pb->event,
                'url' => $pb->url,
                'is_active' => (bool) $pb->is_active,
            ])
            ->values();

        $logs = PostbackLog::where('webmaster_id', $user->id)
            ->where('created_at', '>=', now()->subDays(10))
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = $request->string('search')->toString();
                $query->where(function ($q) use ($term) {
                    $q->where('url', 'like', "%{$term}%")
                        ->orWhere('event', 'like', "%{$term}%")
                        ->orWhere('status_code', 'like', "%{$term}%")
                        ->orWhere('lead_id', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('event'), fn($q) => $q->where('event', $request->string('event')->toString()))
            ->when($request->filled('result'), function ($q) use ($request) {
                $res = $request->string('result')->toString();
                if ($res === 'ok') {
                    $q->whereNull('error_message');
                } elseif ($res === 'error') {
                    $q->whereNotNull('error_message');
                }
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $allowedOfferIds = Offer::query()
            ->where('is_active', true)
            ->where(function ($q) use ($user) {
                $q->where(function ($public) use ($user) {
                    $public->where('is_private', false)
                        ->whereDoesntHave('rates', function ($r) use ($user) {
                            $r->where('webmaster_id', $user->id)->where('is_allowed', false);
                        });
                })
                    ->orWhereHas('rates', fn ($r) => $r->where('webmaster_id', $user->id)->where('is_allowed', true));
            })
            ->pluck('id')
            ->all();

        $smartLinksQuery = SmartLink::query()
            ->where('is_active', true)
            ->with([
                'streams.offer:id,name,is_active',
                'assignments' => fn ($q) => $q->where('webmaster_id', $user->id),
            ])
            ->orderBy('name');

        $smartLinksRaw = $smartLinksQuery->get();

        $clickStatsMap = SmartLinkClick::query()
            ->where('webmaster_id', $user->id)
            ->whereIn('smart_link_id', $smartLinksRaw->pluck('id')->all())
            ->selectRaw('smart_link_id, COUNT(*) as clicks_count, SUM(CASE WHEN converted_at IS NOT NULL THEN 1 ELSE 0 END) as conversions_count')
            ->groupBy('smart_link_id')
            ->get()
            ->keyBy('smart_link_id');

        $smartLinks = $smartLinksRaw
            ->map(function (SmartLink $smartLink) use ($allowedOfferIds, $user, $clickStatsMap) {
                $assignment = $smartLink->assignments->first();

                if (! $smartLink->is_public && (! $assignment || ! $assignment->is_active)) {
                    return null;
                }

                if ($smartLink->is_public && (! $assignment || ! $assignment->is_active)) {
                    if ($assignment) {
                        $assignment->update([
                            'is_active' => true,
                            'token' => $assignment->token ?: SmartLinkAssignment::generateToken(),
                        ]);
                    } else {
                        $assignment = SmartLinkAssignment::create([
                            'partner_program_id' => $smartLink->partner_program_id,
                            'smart_link_id' => $smartLink->id,
                            'webmaster_id' => $user->id,
                            'token' => SmartLinkAssignment::generateToken(),
                            'is_active' => true,
                        ]);
                    }
                }

                $allowedStreams = $smartLink->streams
                    ->where('is_active', true)
                    ->filter(function ($stream) use ($allowedOfferIds) {
                        if ($stream->target_url) {
                            return true;
                        }

                        if (! $stream->offer || ! $stream->offer->is_active) {
                            return false;
                        }

                        return in_array((int) $stream->offer_id, $allowedOfferIds, true);
                    })
                    ->values();

                if ($allowedStreams->isEmpty()) {
                    return null;
                }

                $baseUrl = route('smart-links.redirect', ['smartLink' => $smartLink->slug]);
                $tokenizedUrl = $assignment?->token
                    ? $baseUrl.'?wm_token='.urlencode($assignment->token)
                    : $baseUrl;

                $clickStats = $clickStatsMap->get($smartLink->id);

                return [
                    'id' => $smartLink->id,
                    'name' => $smartLink->name,
                    'slug' => $smartLink->slug,
                    'url' => $tokenizedUrl,
                    'streams_count' => $allowedStreams->count(),
                    'is_public' => (bool) $smartLink->is_public,
                    'clicks_count' => (int) ($clickStats?->clicks_count ?? 0),
                    'conversions_count' => (int) ($clickStats?->conversions_count ?? 0),
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('Webmaster/Tools/Index', [
            'apiKey' => $apiKey,
            'postbacks' => $postbacks,
            'logs' => $logs,
            'smartLinks' => $smartLinks,
            'eventOptions' => $this->allowedEvents,
            'filters' => [
                'search' => $request->query('search'),
                'event' => $request->query('event'),
                'result' => $request->query('result'),
            ],
        ]);
    }

    public function regenerateKey(Request $request)
    {
        $user = $request->user();
        ApiKey::where('webmaster_id', $user->id)->update(['is_active' => false]);

        $apiKey = ApiKey::create([
            'webmaster_id' => $user->id,
            'key' => Str::uuid()->toString(),
            'is_active' => true,
            'partner_program_id' => $user->partner_program_id,
        ]);

        return back()->with('success', 'API ключ обновлен')->with('apiKey', $apiKey);
    }

    public function savePostbacks(Request $request)
    {
        $user = $request->user();

        $filtered = collect($request->input('postbacks', []))
            ->map(function ($pb) {
                return [
                    'event' => $pb['event'] ?? '',
                    'url' => trim($pb['url'] ?? ''),
                    'is_active' => $pb['is_active'] ?? true,
                ];
            })
            ->filter(fn($pb) => $pb['url'] !== '' && in_array($pb['event'], $this->allowedEvents, true))
            ->values();

        $validated = validator($filtered->toArray(), [
            '*.event' => ['required', 'in:lead,in_work,sale,cancel,trash'],
            '*.url' => ['required', 'string', 'max:2000'],
            '*.is_active' => ['boolean'],
        ])->validate();

        foreach ($validated as $pb) {
            PostbackSetting::updateOrCreate(
                ['webmaster_id' => $user->id, 'event' => $pb['event'], 'partner_program_id' => $user->partner_program_id],
                ['url' => $pb['url'], 'is_active' => (bool) ($pb['is_active'] ?? true)],
            );
        }

        $savedEvents = array_column($validated, 'event');
        PostbackSetting::where('webmaster_id', $user->id)
            ->whereIn('event', $this->allowedEvents)
            ->whereNotIn('event', $savedEvents)
            ->delete();

        return back()->with('success', 'Вебхуки сохранены');
    }
}
