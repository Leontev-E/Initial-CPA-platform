<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\SmartLink;
use App\Models\SmartLinkAssignment;
use App\Models\SmartLinkClick;
use App\Models\SmartLinkPreset;
use App\Models\User;
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
            ->withCount(['streams', 'clicks', 'assignments'])
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
            'webmasters' => User::query()
                ->where('role', User::ROLE_WEBMASTER)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'is_active']),
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $partnerProgramId = app(PartnerProgramContext::class)->getPartnerProgramId() ?? $request->user()?->partner_program_id;
        $validated = $this->validatePayload($request, $partnerProgramId);

        if (! ($validated['is_public'] ?? true) && empty($validated['webmaster_ids'] ?? [])) {
            throw ValidationException::withMessages([
                'webmaster_ids' => 'At least one webmaster is required for private smart links.',
            ]);
        }

        $smartLink = SmartLink::create([
            'partner_program_id' => $partnerProgramId,
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'is_public' => (bool) ($validated['is_public'] ?? true),
            'fallback_offer_id' => $validated['fallback_offer_id'] ?? null,
            'fallback_url' => $validated['fallback_url'] ?? null,
            'postback_token' => $validated['postback_token'] ?? Str::lower(Str::random(40)),
            'settings' => $validated['settings'] ?? null,
        ]);

        $this->syncStreams($smartLink, collect($validated['streams'] ?? []), $partnerProgramId);
        $this->syncAssignments($smartLink, collect($validated['webmaster_ids'] ?? []), $partnerProgramId);

        return redirect()->route('admin.smart-links.show', $smartLink)->with('success', 'SmartLink created.');
    }

    public function show(Request $request, SmartLink $smartLink): Response
    {
        $smartLink->load([
            'streams.offer:id,name,is_active',
            'streams.preset:id,name,default_weight,default_priority,rules',
            'fallbackOffer:id,name,is_active',
            'assignments.webmaster:id,name,email,is_active',
        ]);

        $clickQuery = SmartLinkClick::query()
            ->where('smart_link_id', $smartLink->id)
            ->with([
                'stream:id,name,weight,priority',
                'offer:id,name',
                'webmaster:id,name,email',
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

        if ($request->filled('webmaster_id')) {
            $clickQuery->where('webmaster_id', $request->integer('webmaster_id'));
        }

        $clicks = $clickQuery->paginate(30)->withQueryString();

        return Inertia::render('Admin/SmartLinks/Show', [
            'smartLink' => $smartLink,
            'offers' => Offer::query()->orderBy('name')->get(['id', 'name', 'is_active']),
            'presets' => SmartLinkPreset::query()->orderBy('name')->get(['id', 'name', 'default_weight', 'default_priority', 'rules', 'is_active']),
            'webmasters' => User::query()
                ->where('role', User::ROLE_WEBMASTER)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'is_active']),
            'clicks' => $clicks,
            'clickFilters' => $request->only(['click_id', 'geo', 'offer_id', 'stream_id', 'webmaster_id']),
            'redirectUrl' => route('smart-links.redirect', ['smartLink' => $smartLink->slug]),
            'postback' => [
                'endpoint' => route('api.smart-links.postback'),
                'token' => $smartLink->postback_token,
                'sample' => route('api.smart-links.postback', [
                    'token' => $smartLink->postback_token,
                    'click_id' => '{click_id}',
                    'status' => 'sale',
                    'payout' => '{payout}',
                    'revenue' => '{revenue}',
                ]),
            ],
        ]);
    }

    public function update(Request $request, SmartLink $smartLink): RedirectResponse
    {
        $partnerProgramId = $smartLink->partner_program_id;
        $validated = $this->validatePayload($request, $partnerProgramId, $smartLink->id);

        if (! ($validated['is_public'] ?? true) && empty($validated['webmaster_ids'] ?? [])) {
            throw ValidationException::withMessages([
                'webmaster_ids' => 'At least one webmaster is required for private smart links.',
            ]);
        }

        $smartLink->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'is_public' => (bool) ($validated['is_public'] ?? true),
            'fallback_offer_id' => $validated['fallback_offer_id'] ?? null,
            'fallback_url' => $validated['fallback_url'] ?? null,
            'postback_token' => $validated['postback_token'] ?? $smartLink->postback_token ?? Str::lower(Str::random(40)),
            'settings' => $validated['settings'] ?? null,
        ]);

        $this->syncStreams($smartLink, collect($validated['streams'] ?? []), $partnerProgramId);
        $this->syncAssignments($smartLink, collect($validated['webmaster_ids'] ?? []), $partnerProgramId);

        return back()->with('success', 'SmartLink updated.');
    }

    public function toggle(SmartLink $smartLink): RedirectResponse
    {
        $smartLink->update(['is_active' => ! $smartLink->is_active]);

        return back()->with('success', 'SmartLink status updated.');
    }

    public function destroy(SmartLink $smartLink): RedirectResponse
    {
        $smartLink->delete();

        return redirect()->route('admin.smart-links.index')->with('success', 'SmartLink deleted.');
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
            'is_public' => ['boolean'],
            'fallback_offer_id' => [
                'nullable',
                Rule::exists('offers', 'id')->where('partner_program_id', $partnerProgramId),
            ],
            'fallback_url' => ['nullable', 'url', 'max:2048'],
            'postback_token' => [
                'nullable',
                'string',
                'max:80',
                Rule::unique('smart_links', 'postback_token')->ignore($smartLinkId),
            ],
            'settings' => ['nullable', 'array'],
            'webmaster_ids' => ['nullable', 'array'],
            'webmaster_ids.*' => [
                Rule::exists('users', 'id')
                    ->where('partner_program_id', $partnerProgramId)
                    ->where('role', User::ROLE_WEBMASTER),
            ],
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
                    "streams.{$index}.target_url" => 'Each stream requires offer_id or target_url.',
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

    private function syncAssignments(SmartLink $smartLink, Collection $webmasterIds, int $partnerProgramId): void
    {
        $ids = $webmasterIds
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        $existing = $smartLink->assignments()->get()->keyBy('webmaster_id');
        $keep = [];

        foreach ($ids as $webmasterId) {
            $keep[] = $webmasterId;
            $row = $existing->get($webmasterId);

            if ($row) {
                $row->update(['is_active' => true]);
                continue;
            }

            $smartLink->assignments()->create([
                'partner_program_id' => $partnerProgramId,
                'webmaster_id' => $webmasterId,
                'token' => SmartLinkAssignment::generateToken(),
                'is_active' => true,
            ]);
        }

        $smartLink->assignments()
            ->when($keep !== [], fn ($q) => $q->whereNotIn('webmaster_id', $keep))
            ->when($keep === [], fn ($q) => $q)
            ->delete();
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

