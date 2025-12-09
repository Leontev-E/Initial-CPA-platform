<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferLanding;
use App\Models\OfferCategory;
use App\Models\OfferWebmasterRate;
use App\Models\User;
use App\Support\PartnerProgramContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use ZipArchive;

class OfferController extends Controller
{
    public function index(Request $request)
    {
        $partnerProgram = app(PartnerProgramContext::class)->getPartnerProgram();
        $offerCount = Offer::count();
        $offerLimit = $partnerProgram?->offer_limit;
        $offerLimitReached = $partnerProgram && ! $partnerProgram->is_unlimited && $offerLimit !== null && $offerCount >= $offerLimit;

        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50], true) ? $perPage : 10;
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $query = Offer::query()->with(['category', 'categories']);

        if ($request->filled('category_id')) {
            $categoryId = $request->integer('category_id');
            $query->where(function ($q) use ($categoryId) {
                $q->where('offer_category_id', $categoryId)
                    ->orWhereHas('categories', fn ($c) => $c->where('offer_category_id', $categoryId));
            });
        }

        $geoFilters = [];
        if ($request->has('geos')) {
            $geoFilters = array_filter(array_map(
                fn ($g) => strtoupper(trim($g)),
                (array) $request->input('geos', [])
            ));
        }
        if (empty($geoFilters) && $request->filled('geo')) {
            $geoFilters = [strtoupper($request->string('geo')->toString())];
        }
        if (!empty($geoFilters)) {
            $query->where(function ($q) use ($geoFilters) {
                foreach ($geoFilters as $geo) {
                    $q->orWhereJsonContains('allowed_geos', $geo);
                }
            });
        }

        if ($request->filled('status')) {
            if ($request->input('status') === 'active') {
                $query->where('is_active', true);
            } elseif ($request->input('status') === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search')->toString().'%');
        }

        if ($sort === 'category') {
            // Сортируем по основной категории без JOIN, чтобы не дублировать строки и не требовать сравнения JSON
            $query->orderByRaw('(select oc.name from offer_categories oc where oc.id = offers.offer_category_id limit 1) '.$direction);
        } elseif (in_array($sort, ['name', 'default_payout', 'created_at'], true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('name');
        }

        $offers = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Offers/Index', [
            'offers' => $offers,
            'categories' => OfferCategory::orderBy('name')->get(),
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)
                ->where('partner_program_id', $partnerProgram?->id ?? $request->user()->partner_program_id)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'filters' => $request->only(['category_id', 'status', 'search', 'sort', 'direction', 'per_page', 'geo', 'geos']),
            'offerLimit' => [
                'count' => $offerCount,
                'limit' => $offerLimit,
                'is_unlimited' => (bool) ($partnerProgram?->is_unlimited),
                'reached' => $offerLimitReached,
            ],
        ]);
    }

    public function show(Offer $offer)
    {
        $offer->load(['category', 'categories', 'rates.webmaster', 'landings']);

        return Inertia::render('Admin/Offers/Show', [
            'offer' => $offer,
            'categories' => OfferCategory::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $partnerProgram = app(PartnerProgramContext::class)->getPartnerProgram();
        $currentCount = Offer::count();
        if ($partnerProgram && ! $partnerProgram->is_unlimited) {
            $limit = $partnerProgram->offer_limit ?? 0;
            if ($limit !== null && $currentCount >= $limit) {
                return back()->withErrors(['limit' => 'Вы достигли лимита по количеству офферов.'])->withInput();
            }
        }

        $validated = $this->validateData($request);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('offers', 'public');
        }

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['allowed_geos'] = $this->normalizeGeos($validated['allowed_geos'] ?? []);

        $primaryCategory = $validated['offer_category_id'] ?? ($validated['category_ids'][0] ?? null);
        $validated['offer_category_id'] = $primaryCategory;

        $validated['partner_program_id'] = $partnerProgram?->id ?? $request->user()->partner_program_id;

        $offer = Offer::create($validated);
        $offer->categories()->sync($validated['category_ids'] ?? array_filter([$primaryCategory]));

        $this->syncAllowedWebmasters($offer, $validated['allowed_webmasters'] ?? [], (bool) ($validated['is_private'] ?? false));

        return redirect()->route('admin.offers.index')->with('success', 'Оффер создан');
    }

    public function update(Request $request, Offer $offer)
    {
        $validated = $this->validateData($request, $offer->id);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('offers', 'public');
        }

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['allowed_geos'] = $this->normalizeGeos($validated['allowed_geos'] ?? []);

        $primaryCategory = $validated['offer_category_id'] ?? ($validated['category_ids'][0] ?? $offer->offer_category_id);
        $validated['offer_category_id'] = $primaryCategory;

        $validated['partner_program_id'] = $offer->partner_program_id;

        $offer->update($validated);
        $offer->categories()->sync($validated['category_ids'] ?? array_filter([$primaryCategory]));

        $this->syncAllowedWebmasters($offer, $validated['allowed_webmasters'] ?? [], (bool) ($validated['is_private'] ?? false));

        return back()->with('success', 'Оффер обновлен');
    }

    public function destroy(Offer $offer)
    {
        $offer->delete();
        return redirect()->route('admin.offers.index')->with('success', 'Оффер удален');
    }

    public function toggle(Offer $offer)
    {
        $offer->update(['is_active' => ! $offer->is_active]);

        return back()->with('success', 'Оффер '.($offer->is_active ? 'включен' : 'выключен'));
    }

    protected function validateData(Request $request, ?int $offerId = null): array
    {
        $partnerProgramId = app(PartnerProgramContext::class)->getPartnerProgramId() ?? $request->user()?->partner_program_id;

        return $request->validate([
            'offer_category_id' => [
                'nullable',
                Rule::exists('offer_categories', 'id')->where('partner_program_id', $partnerProgramId),
            ],
            'category_ids' => ['array'],
            'category_ids.*' => [
                Rule::exists('offer_categories', 'id')->where('partner_program_id', $partnerProgramId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('offers', 'slug')
                    ->where('partner_program_id', $partnerProgramId)
                    ->ignore($offerId),
            ],
            'default_payout' => ['required', 'numeric', 'min:0'],
            'allowed_geos' => ['nullable'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'materials_link' => ['nullable', 'url', 'max:2048'],
            'call_center_hours' => ['nullable', 'string', 'max:255'],
            'call_center_timezone' => ['nullable', 'in:local,msk'],
            'is_active' => ['boolean'],
            'is_private' => ['boolean'],
            'allowed_webmasters' => ['array'],
            'allowed_webmasters.*.webmaster_id' => [
                'required_with:allowed_webmasters',
                'integer',
                Rule::exists('users', 'id')
                    ->where('partner_program_id', $partnerProgramId)
                    ->where('role', User::ROLE_WEBMASTER),
            ],
            'allowed_webmasters.*.custom_payout' => ['nullable', 'numeric', 'min:0'],
            'image' => ['nullable', 'image'],
        ]);
    }

    private function syncAllowedWebmasters(Offer $offer, array $webmasters, bool $isPrivate): void
    {
        if (! $isPrivate) {
            return;
        }

        $ids = collect($webmasters)
            ->filter(fn ($row) => ! empty($row['webmaster_id']))
            ->map(function ($row) use ($offer) {
                $custom = isset($row['custom_payout']) && $row['custom_payout'] !== '' ? $row['custom_payout'] : null;
                OfferWebmasterRate::updateOrCreate(
                    [
                        'offer_id' => $offer->id,
                        'webmaster_id' => (int) $row['webmaster_id'],
                    ],
                    [
                        'partner_program_id' => $offer->partner_program_id,
                        'custom_payout' => $custom,
                    ]
                );
                return (int) $row['webmaster_id'];
            })
            ->unique()
            ->values();

        OfferWebmasterRate::where('offer_id', $offer->id)
            ->whereNotIn('webmaster_id', $ids)
            ->delete();
    }

    protected function normalizeGeos(array|string|null $geos): array
    {
        if (is_array($geos)) {
            return array_values(array_filter($geos));
        }

        if (is_string($geos)) {
            return array_values(array_filter(array_map('trim', explode(',', $geos))));
        }

        return [];
    }

    public function addLanding(Request $request, Offer $offer)
    {
        $this->authorizeOffer($offer);

        $messages = [
            'type.required' => 'Укажите тип лендинга',
            'type.in' => 'Тип лендинга должен быть local или link',
            'name.required' => 'Введите название лендинга',
            'landing_file.required_if' => 'Загрузите ZIP-файл лендинга',
            'landing_file.mimes' => 'Допустим только ZIP-архив',
            'landing_file.max' => 'Максимальный размер файла 70 МБ',
            'url.required_if' => 'Укажите ссылку на лендинг',
            'url.url' => 'Некорректная ссылка на лендинг',
        ];

        $validated = $request->validate([
            'type' => ['required', 'in:local,link'],
            'name' => ['required', 'string', 'max:255'],
            'landing_file' => ['required_if:type,local', 'file', 'mimes:zip', 'max:71680'], // ~70MB
            'url' => ['required_if:type,link', 'url', 'max:2048'],
        ], $messages);

        if ($validated['type'] === 'local') {
            $existingLocal = $offer->landings()->where('type', 'local')->count();
            if ($existingLocal >= 2) {
                return back()->with('error', 'Можно загрузить не более 2 локальных лендингов');
            }

            $file = $request->file('landing_file');
            $path = $file->store('landings/raw', 'public');

            $landing = $offer->landings()->create([
                'partner_program_id' => $offer->partner_program_id,
                'type' => 'local',
                'name' => $validated['name'],
                'file_path' => $path,
                'size' => $file->getSize(),
            ]);

            $this->extractLanding($landing, $file->getPathname());
        } else {
            $existingLinks = $offer->landings()->where('type', 'link')->count();
            if ($existingLinks >= 10) {
                return back()->with('error', 'Можно добавить не более 10 лендингов по ссылке');
            }

            $offer->landings()->create([
                'partner_program_id' => $offer->partner_program_id,
                'type' => 'link',
                'name' => $validated['name'],
                'url' => $validated['url'],
            ]);
        }

        return back()->with('success', 'Лендинг добавлен');
    }

    public function removeLanding(Offer $offer, OfferLanding $landing)
    {
        $this->authorizeOffer($offer);

        if ($landing->offer_id !== $offer->id) {
            abort(403);
        }

        if ($landing->file_path) {
            Storage::disk('public')->delete($landing->file_path);
        }
        if ($landing->preview_path) {
            Storage::disk('public')->deleteDirectory(dirname($landing->preview_path));
        }

        $landing->delete();

        return back()->with('success', 'Лендинг удален');
    }

    protected function extractLanding(OfferLanding $landing, string $zipPath): void
    {
        $folder = 'landings/extracted/'.$landing->id;
        $storagePath = Storage::disk('public')->path($folder);
        if (!is_dir($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath) === true) {
            $zip->extractTo($storagePath);
            $zip->close();
        }

        $landing->preview_path = $folder.'/index.html';
        $landing->save();
    }

    protected function authorizeOffer(Offer $offer): void
    {
        // Admin only; adjust if roles change
        if (!auth()->user()?->isAdmin()) {
            abort(403);
        }
    }
}
