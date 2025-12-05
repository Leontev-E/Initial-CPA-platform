<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\PostbackLog;
use App\Models\PostbackSetting;
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
            ['key' => Str::uuid()->toString()]
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

        return Inertia::render('Webmaster/Tools/Index', [
            'apiKey' => $apiKey,
            'postbacks' => $postbacks,
            'logs' => $logs,
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
                ['webmaster_id' => $user->id, 'event' => $pb['event']],
                ['url' => $pb['url'], 'is_active' => (bool) ($pb['is_active'] ?? true)],
            );
        }

        $savedEvents = array_column($validated, 'event');
        PostbackSetting::where('webmaster_id', $user->id)
            ->whereIn('event', $this->allowedEvents)
            ->whereNotIn('event', $savedEvents)
            ->delete();

        return back()->with('success', 'Постбеки сохранены');
    }
}
