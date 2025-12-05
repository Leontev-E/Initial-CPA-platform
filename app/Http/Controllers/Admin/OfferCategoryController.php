<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OfferCategoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50], true) ? $perPage : 10;
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc') === 'desc' ? 'desc' : 'asc';
        $status = $request->input('status');
        $offerSearch = $request->string('offer_search')->toString();
        $offerStatus = $request->input('offer_status');
        $offerPerPage = (int) $request->integer('offer_per_page', 10);
        $offerPerPage = in_array($offerPerPage, [10, 25, 50], true) ? $offerPerPage : 10;

        $categories = OfferCategory::query()
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false));

        if (in_array($sort, ['name', 'created_at'], true)) {
            $categories->orderBy($sort, $direction);
        } else {
            $categories->orderBy('name');
        }

        $categories = $categories
            ->paginate($perPage)
            ->withQueryString();

        $attachOffers = \App\Models\Offer::query()
            ->with('categories')
            ->when($offerSearch, fn ($q) => $q->where('name', 'like', "%{$offerSearch}%"))
            ->when($offerStatus === 'active', fn ($q) => $q->where('is_active', true))
            ->when($offerStatus === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy('name')
            ->select('offers.*')
            ->paginate($offerPerPage, ['*'], 'offer_page')
            ->withQueryString();

        return Inertia::render('Admin/OfferCategories/Index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sort,
                'direction' => $direction,
                'status' => $status,
            ],
            'attachOffers' => $attachOffers,
            'attachFilters' => [
                'offer_search' => $offerSearch,
                'offer_status' => $offerStatus,
                'offer_per_page' => $offerPerPage,
            ],
        ]);
    }

    public function show(Request $request, OfferCategory $offerCategory)
    {
        $listSearch = $request->string('search')->toString();
        $listStatus = $request->input('status');
        $listPerPage = in_array((int) $request->integer('per_page', 10), [10, 25, 50], true) ? (int) $request->integer('per_page', 10) : 10;
        $listSort = $request->input('sort', 'name');
        $listDirection = $request->input('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $offersInCategory = $offerCategory->offersMany()
            ->with('categories')
            ->when($listSearch, fn ($q) => $q->where('name', 'like', "%{$listSearch}%"))
            ->when($listStatus === 'active', fn ($q) => $q->where('is_active', true))
            ->when($listStatus === 'inactive', fn ($q) => $q->where('is_active', false));

        if (in_array($listSort, ['name', 'default_payout', 'created_at'], true)) {
            $offersInCategory->orderBy($listSort, $listDirection);
        } else {
            $offersInCategory->orderBy('name');
        }

        $offersInCategory = $offersInCategory
            ->paginate($listPerPage)
            ->withQueryString();

        $attachSearch = $request->string('attach_search')->toString();
        $attachStatus = $request->input('attach_status');
        $attachPerPage = in_array((int) $request->integer('attach_per_page', 10), [10, 25, 50], true) ? (int) $request->integer('attach_per_page', 10) : 10;

        $attachOffers = Offer::query()
            ->with('categories:id,name')
            ->when($attachSearch, fn ($q) => $q->where('name', 'like', "%{$attachSearch}%"))
            ->when($attachStatus === 'active', fn ($q) => $q->where('is_active', true))
            ->when($attachStatus === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy('name')
            ->paginate($attachPerPage, ['*'], 'attach_page')
            ->withQueryString();

        $attachedIds = $offerCategory->offersMany()->pluck('offers.id')->all();

        return Inertia::render('Admin/OfferCategories/Show', [
            'category' => $offerCategory,
            'offers' => $offersInCategory,
            'filters' => [
                'search' => $listSearch,
                'status' => $listStatus,
                'sort' => $listSort,
                'direction' => $listDirection,
                'per_page' => $listPerPage,
            ],
            'attachOffers' => $attachOffers,
            'attachFilters' => [
                'attach_search' => $attachSearch,
                'attach_status' => $attachStatus,
                'attach_per_page' => $attachPerPage,
            ],
            'attachedIds' => $attachedIds,
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
            'slug' => ['nullable', 'string', 'max:255', "unique:offer_categories,slug,{$offerCategory->id}"],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = $validated['slug'] ?? $offerCategory->slug ?? Str::slug($validated['name']);

        $offerCategory->update($validated);

        return back()->with('success', 'Категория обновлена');
    }

    public function destroy(OfferCategory $offerCategory)
    {
        // Отвязываем офферы и удаляем категорию
        $offerCategory->offersMany()->detach();
        $offerCategory->delete();

        return back()->with('success', 'Категория удалена');
    }

    public function toggle(OfferCategory $offerCategory)
    {
        $offerCategory->update(['is_active' => ! $offerCategory->is_active]);

        return back()->with('success', 'Категория '.($offerCategory->is_active ? 'включена' : 'выключена'));
    }

    public function attachOffer(Request $request, OfferCategory $offerCategory)
    {
        $data = $request->validate([
            'offer_id' => ['required', 'exists:offers,id'],
        ]);

        $offerCategory->offersMany()->syncWithoutDetaching([$data['offer_id']]);

        return back()->with('success', 'Оффер добавлен в категорию');
    }

    public function detachOffer(Request $request, OfferCategory $offerCategory)
    {
        $data = $request->validate([
            'offer_id' => ['required', 'exists:offers,id'],
        ]);

        $offerCategory->offersMany()->detach($data['offer_id']);

        return back()->with('success', 'Оффер удален из категории');
    }
}
