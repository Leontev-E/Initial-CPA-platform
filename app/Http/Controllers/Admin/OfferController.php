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
        $query = Offer::query()->with('category');

        if ($request->filled('category_id')) {
            $query->where('offer_category_id', $request->integer('category_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search')->toString().'%');
        }

        $offers = $query->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Offers/Index', [
            'offers' => $offers,
            'categories' => OfferCategory::orderBy('name')->get(),
            'filters' => $request->only(['category_id', 'is_active', 'search']),
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
