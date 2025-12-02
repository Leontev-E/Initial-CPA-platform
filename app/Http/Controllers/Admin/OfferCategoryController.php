<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OfferCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OfferCategoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $categories = OfferCategory::query()
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/OfferCategories/Index', [
            'categories' => $categories,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:offer_categories,slug'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        OfferCategory::create($validated);

        return back()->with('success', 'Категория создана');
    }

    public function update(Request $request, OfferCategory $offerCategory)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', "unique:offer_categories,slug,{$offerCategory->id}"],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $offerCategory->update($validated);

        return back()->with('success', 'Категория обновлена');
    }

    public function destroy(OfferCategory $offerCategory)
    {
        // Удаляем офферы категории, каскадно удалятся связанные лиды и ставки
        $offerCategory->offers()->each(function ($offer) {
            $offer->delete();
        });

        $offerCategory->delete();

        return back()->with('success', 'Категория удалена');
    }
}
