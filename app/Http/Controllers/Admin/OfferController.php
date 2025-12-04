<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferLanding;
use App\Models\OfferCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use ZipArchive;

class OfferController extends Controller
{
    public function index(Request $request)
    {
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
            $query->leftJoin('offer_offer_category', 'offers.id', '=', 'offer_offer_category.offer_id')
                ->leftJoin('offer_categories', 'offer_offer_category.offer_category_id', '=', 'offer_categories.id')
                ->select('offers.*')
                ->orderBy('offer_categories.name', $direction);
        } elseif (in_array($sort, ['name', 'default_payout', 'created_at'], true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('name');
        }

        $offers = $query->distinct()->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Offers/Index', [
            'offers' => $offers,
            'categories' => OfferCategory::orderBy('name')->get(),
            'filters' => $request->only(['category_id', 'status', 'search', 'sort', 'direction', 'per_page', 'geo', 'geos']),
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
        $validated = $this->validateData($request);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('offers', 'public');
        }

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['allowed_geos'] = $this->normalizeGeos($validated['allowed_geos'] ?? []);

        $primaryCategory = $validated['offer_category_id'] ?? ($validated['category_ids'][0] ?? null);
        $validated['offer_category_id'] = $primaryCategory;

        $offer = Offer::create($validated);
        $offer->categories()->sync($validated['category_ids'] ?? array_filter([$primaryCategory]));

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

        $offer->update($validated);
        $offer->categories()->sync($validated['category_ids'] ?? array_filter([$primaryCategory]));

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
        return $request->validate([
            'offer_category_id' => ['nullable', 'exists:offer_categories,id'],
            'category_ids' => ['array'],
            'category_ids.*' => ['exists:offer_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:offers,slug,'.$offerId],
            'default_payout' => ['required', 'numeric', 'min:0'],
            'allowed_geos' => ['nullable'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'image' => ['nullable', 'image'],
        ]);
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
