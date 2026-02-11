<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmartLinkPreset;
use App\Support\PartnerProgramContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SmartLinkPresetController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $partnerProgramId = app(PartnerProgramContext::class)->getPartnerProgramId() ?? $request->user()?->partner_program_id;
        $validated = $this->validatePayload($request, $partnerProgramId);

        SmartLinkPreset::create([
            'partner_program_id' => $partnerProgramId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'default_weight' => (int) ($validated['default_weight'] ?? 100),
            'default_priority' => (int) ($validated['default_priority'] ?? 0),
            'rules' => $this->normalizeRules($validated['rules'] ?? []),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', 'Preset created');
    }

    public function update(Request $request, SmartLinkPreset $smartLinkPreset): RedirectResponse
    {
        $validated = $this->validatePayload($request, $smartLinkPreset->partner_program_id, $smartLinkPreset->id);

        $smartLinkPreset->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'default_weight' => (int) ($validated['default_weight'] ?? 100),
            'default_priority' => (int) ($validated['default_priority'] ?? 0),
            'rules' => $this->normalizeRules($validated['rules'] ?? []),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', 'Preset updated');
    }

    public function destroy(SmartLinkPreset $smartLinkPreset): RedirectResponse
    {
        $smartLinkPreset->delete();

        return back()->with('success', 'Preset deleted');
    }

    private function validatePayload(Request $request, int $partnerProgramId, ?int $presetId = null): array
    {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('smart_link_presets', 'name')
                    ->where('partner_program_id', $partnerProgramId)
                    ->ignore($presetId),
            ],
            'description' => ['nullable', 'string'],
            'default_weight' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'default_priority' => ['nullable', 'integer', 'min:-100000', 'max:100000'],
            'is_active' => ['boolean'],
            'rules' => ['nullable', 'array'],
            'rules.geos' => ['nullable', 'array'],
            'rules.geos.*' => ['string', 'max:4'],
            'rules.devices' => ['nullable', 'array'],
            'rules.devices.*' => ['string', Rule::in(['desktop', 'mobile', 'tablet'])],
            'rules.query' => ['nullable', 'array'],
        ]);
    }

    private function normalizeRules(array $rules): array
    {
        $geos = collect((array) ($rules['geos'] ?? []))
            ->map(fn ($item) => strtoupper(trim((string) $item)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $devices = collect((array) ($rules['devices'] ?? []))
            ->map(fn ($item) => strtolower(trim((string) $item)))
            ->filter(fn ($item) => in_array($item, ['desktop', 'mobile', 'tablet'], true))
            ->unique()
            ->values()
            ->all();

        $query = [];
        $queryRules = $rules['query'] ?? [];
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
}
