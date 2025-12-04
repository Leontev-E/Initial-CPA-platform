<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OfferController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50], true) ? $perPage : 10;
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $query = Offer::query()->with('category');

        if ($request->filled('category_id')) {
            $query->where('offer_category_id', $request->integer('category_id'));
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
            $query->leftJoin('offer_categories', 'offers.offer_category_id', '=', 'offer_categories.id')
                ->select('offers.*')
                ->orderBy('offer_categories.name', $direction);
        } elseif (in_array($sort, ['name', 'default_payout', 'created_at'], true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('name');
        }

        $offers = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Offers/Index', [
            'offers' => $offers,
            'categories' => OfferCategory::orderBy('name')->get(),
            'filters' => $request->only(['category_id', 'status', 'search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function show(Offer $offer)
    {
        $offer->load(['category', 'rates.webmaster']);

        return Inertia::render('Admin/Offers/Show', [
            'offer' => $offer,
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

        Offer::create($validated);

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

        $offer->update($validated);

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
            'offer_category_id' => ['required', 'exists:offer_categories,id'],
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
}
