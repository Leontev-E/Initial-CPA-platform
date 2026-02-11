<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\SmartLink;
use App\Models\SmartLinkPreset;
use App\Models\SmartLinkClick;
use App\Support\PartnerProgramContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SmartLinkController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = in_array((int) $request->integer('per_page', 10), [10, 25, 50], true)
            ? (int) $request->integer('per_page', 10)
            : 10;

        $query = SmartLink::query()
            ->withCount(['streams', 'clicks'])
            ->with('fallbackOffer:id,name')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $term = $request->string('search')->toString();
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('slug', 'like', "%{$term}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->string('status')->toString() === 'active') {
                $query->where('is_active', true);
            }
            if ($request->string('status')->toString() === 'inactive') {
                $query->where('is_active', false);
            }
        }

        return Inertia::render('Admin/SmartLinks/Index', [
            'smartLinks' => $query->paginate($perPage)->withQueryString(),
            'offers' => Offer::query()->orderBy('name')->get(['id', 'name', 'is_active']),
            'presets' => SmartLinkPreset::query()->orderBy('name')->get(['id', 'name', 'default_weight', 'default_priority', 'rules', 'is_active']),
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $partnerProgramId = app(PartnerProgramContext::class)->getPartnerProgramId() ?? $request->user()?->partner_program_id;

        $validated = $this->validatePayload($request, $partnerProgramId);

        $smartLink = SmartLink::create([
            'partner_program_id' => $partnerProgramId,
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'fallback_offer_id' => $validated['fallback_offer_id'] ?? null,
            'fallback_url' => $validated['fallback_url'] ?? null,
            'settings' => $validated['settings'] ?? null,
        ]);

        $this->syncStreams($smartLink, collect($validated['streams'] ?? []), $partnerProgramId);

        return redirect()->route('admin.smart-links.show', $smartLink)->with('success', 'Смартлинк создан');
    }

    public function show(Request $request, SmartLink $smartLink): Response
    {
        $smartLink->load([
            'streams.offer:id,name,is_active',
            'streams.preset:id,name,default_weight,default_priority,rules',
            'fallbackOffer:id,name,is_active',
        ]);

        $clickQuery = SmartLinkClick::query()
            ->where('smart_link_id', $smartLink->id)
            ->with([
                'stream:id,name,weight,priority',
                'offer:id,name',
            ])
            ->orderByDesc('id');

        if ($request->filled('click_id')) {
            $clickQuery->where('click_id', 'like', '%'.$request->string('click_id')->toString().'%');
        }

        if ($request->filled('geo')) {
            $clickQuery->where('geo', strtoupper($request->string('geo')->toString()));
        }

        if ($request->filled('offer_id')) {
            $clickQuery->where('offer_id', $request->integer('offer_id'));
        }

        if ($request->filled('stream_id')) {
            $clickQuery->where('smart_link_stream_id', $request->integer('stream_id'));
        }

        $clicks = $clickQuery->paginate(30)->withQueryString();

        return Inertia::render('Admin/SmartLinks/Show', [
            'smartLink' => $smartLink,
            'offers' => Offer::query()->orderBy('name')->get(['id', 'name', 'is_active']),
            'presets' => SmartLinkPreset::query()->orderBy('name')->get(['id', 'name', 'default_weight', 'default_priority', 'rules', 'is_active']),
            'clicks' => $clicks,
            'clickFilters' => $request->only(['click_id', 'geo', 'offer_id', 'stream_id']),
            'redirectUrl' => route('smart-links.redirect', ['smartLink' => $smartLink->slug]),
        ]);
    }

    public function update(Request $request, SmartLink $smartLink): RedirectResponse
    {
        $partnerProgramId = $smartLink->partner_program_id;
        $validated = $this->validatePayload($request, $partnerProgramId, $smartLink->id);

        $smartLink->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'fallback_offer_id' => $validated['fallback_offer_id'] ?? null,
            'fallback_url' => $validated['fallback_url'] ?? null,
            'settings' => $validated['settings'] ?? null,
        ]);

        $this->syncStreams($smartLink, collect($validated['streams'] ?? []), $partnerProgramId);

        return back()->with('success', 'Смартлинк обновлен');
    }

    public function toggle(SmartLink $smartLink): RedirectResponse
    {
        $smartLink->update(['is_active' => ! $smartLink->is_active]);

        return back()->with('success', 'Статус смартлинка обновлен');
    }

    public function destroy(SmartLink $smartLink): RedirectResponse
    {
        $smartLink->delete();

        return redirect()->route('admin.smart-links.index')->with('success', 'Смартлинк удален');
    }

    private function validatePayload(Request $request, int $partnerProgramId, ?int $smartLinkId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('smart_links', 'slug')
                    ->where('partner_program_id', $partnerProgramId)
                    ->ignore($smartLinkId),
            ],
            'is_active' => ['boolean'],
            'fallback_offer_id' => [
                'nullable',
                Rule::exists('offers', 'id')->where('partner_program_id', $partnerProgramId),
            ],
            'fallback_url' => ['nullable', 'url', 'max:2048'],
            'settings' => ['nullable', 'array'],
            'streams' => ['nullable', 'array'],
            'streams.*.name' => ['nullable', 'string', 'max:255'],
            'streams.*.offer_id' => [
                'nullable',
                Rule::exists('offers', 'id')->where('partner_program_id', $partnerProgramId),
            ],
            'streams.*.preset_id' => [
                'nullable',
                Rule::exists('smart_link_presets', 'id')->where('partner_program_id', $partnerProgramId),
            ],
            'streams.*.weight' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'streams.*.priority' => ['nullable', 'integer', 'min:-100000', 'max:100000'],
            'streams.*.is_active' => ['boolean'],
            'streams.*.target_url' => ['nullable', 'url', 'max:2048'],
            'streams.*.rules' => ['nullable', 'array'],
            'streams.*.rules.geos' => ['nullable', 'array'],
            'streams.*.rules.geos.*' => ['string', 'max:4'],
            'streams.*.rules.devices' => ['nullable', 'array'],
            'streams.*.rules.devices.*' => ['string', Rule::in(['desktop', 'mobile', 'tablet'])],
            'streams.*.rules.query' => ['nullable', 'array'],
        ]);
    }

    private function syncStreams(SmartLink $smartLink, Collection $streams, int $partnerProgramId): void
    {
        $presetMap = SmartLinkPreset::query()
            ->where('partner_program_id', $partnerProgramId)
            ->get()
            ->keyBy('id');

        $payload = [];

        foreach ($streams->values() as $index => $stream) {
            if (! is_array($stream)) {
                continue;
            }

            $preset = null;
            $presetId = isset($stream['preset_id']) && $stream['preset_id'] !== ''
                ? (int) $stream['preset_id']
                : null;

            if ($presetId) {
                $preset = $presetMap->get($presetId);
            }

            $rules = $this->normalizeRules($stream['rules'] ?? [], $preset?->rules ?? []);

            $weight = isset($stream['weight']) && $stream['weight'] !== ''
                ? max((int) $stream['weight'], 0)
                : (int) ($preset?->default_weight ?? 100);

            $priority = isset($stream['priority']) && $stream['priority'] !== ''
                ? (int) $stream['priority']
                : (int) ($preset?->default_priority ?? 0);

            $offerId = isset($stream['offer_id']) && $stream['offer_id'] !== '' ? (int) $stream['offer_id'] : null;
            $targetUrl = isset($stream['target_url']) && $stream['target_url'] !== '' ? (string) $stream['target_url'] : null;

            if (! $offerId && ! $targetUrl) {
                throw ValidationException::withMessages([
                    "streams.{$index}.target_url" => 'Для потока нужно указать offer_id или target_url.',
                ]);
            }

            $payload[] = [
                'partner_program_id' => $partnerProgramId,
                'offer_id' => $offerId,
                'preset_id' => $preset?->id,
                'name' => $this->valueOrNull($stream, 'name'),
                'weight' => $weight,
                'priority' => $priority,
                'rules' => $rules,
                'target_url' => $targetUrl,
                'is_active' => (bool) ($stream['is_active'] ?? true),
            ];
        }

        $smartLink->streams()->delete();

        if ($payload !== []) {
            $smartLink->streams()->createMany($payload);
        }
    }

    private function normalizeRules(mixed $rulesInput, mixed $presetRulesInput): array
    {
        $rules = is_array($rulesInput) ? $rulesInput : [];
        $presetRules = is_array($presetRulesInput) ? $presetRulesInput : [];

        $merged = array_replace_recursive($presetRules, $rules);

        $geos = collect((array) ($merged['geos'] ?? []))
            ->map(fn ($item) => strtoupper(trim((string) $item)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $devices = collect((array) ($merged['devices'] ?? []))
            ->map(fn ($item) => strtolower(trim((string) $item)))
            ->filter(fn ($item) => in_array($item, ['desktop', 'mobile', 'tablet'], true))
            ->unique()
            ->values()
            ->all();

        $query = [];
        $queryRules = $merged['query'] ?? [];
        if (is_array($queryRules)) {
            foreach ($queryRules as $key => $value) {
                $k = trim((string) $key);
                if ($k === '') {
                    continue;
                }

                $query[$k] = is_scalar($value) ? (string) $value : '';
            }
        }

        return array_filter([
            'geos' => $geos,
            'devices' => $devices,
            'query' => $query,
        ], static fn ($value) => $value !== []);
    }
    
    private function valueOrNull(array $source, string $key): ?string
    {
        if (! array_key_exists($key, $source)) {
            return null;
        }

        $value = trim((string) $source[$key]);

        return $value === '' ? null : $value;
    }
}
