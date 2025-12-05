import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import geosOptions from '@/data/geos.json';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Index({ offers, filters, categories, geos }) {
    const filterForm = useForm({
        search: filters?.search ?? '',
        category_id: filters?.category_id ?? '',
        geos: filters?.geos ?? [],
        per_page: filters?.per_page ?? 12,
    });

    const applyFilters = () => {
        filterForm.get(route('webmaster.offers.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Офферы</h2>}
        >
            <Head title="Офферы" />

            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    <input
                        className="rounded border px-3 py-2 text-sm"
                        placeholder="Поиск по ID или названию"
                        value={filterForm.data.search}
                        onChange={(e) => filterForm.setData('search', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    />
                    <select
                        className="rounded border px-3 py-2 text-sm"
                        value={filterForm.data.category_id}
                        onChange={(e) => {
                            filterForm.setData('category_id', e.target.value);
                            applyFilters();
                        }}
                    >
                        <option value="">Все категории</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        multiple
                        className="rounded border px-3 py-2 text-sm h-20"
                        value={filterForm.data.geos}
                        onChange={(e) =>
                            filterForm.setData(
                                'geos',
                                Array.from(e.target.selectedOptions).map((o) => o.value),
                            )
                        }
                    >
                        {geosOptions.map((geo) => (
                            <option key={geo.value} value={geo.value}>
                                {geo.value} — {geo.text}
                            </option>
                        ))}
                    </select>
                    <select
                        className="rounded border px-3 py-2 text-sm"
                        value={filterForm.data.per_page}
                        onChange={(e) => {
                            filterForm.setData('per_page', e.target.value);
                            applyFilters();
                        }}
                    >
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                    </select>
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={applyFilters}
                        className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                        Применить
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            filterForm.reset();
                            applyFilters();
                        }}
                        className="rounded border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Сбросить
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {offers.data.map((offer) => (
                    <Link
                        key={offer.id}
                        href={route('webmaster.offers.show', offer.id)}
                        className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            {offer.image_url && (
                                <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-50">
                                    <img
                                        src={offer.image_url}
                                        alt={offer.name}
                                        className="h-16 w-16 object-contain"
                                    />
                                </div>
                            )}
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {offer.name}
                                </div>
                                <div className="text-xs text-gray-500">ID: {offer.id}</div>
                                <div className="text-sm text-gray-600">
                                    GEO: {(offer.allowed_geos || []).join(', ')}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-indigo-700">
                            Ставка: {offer.effective_payout} $
                        </div>
                    </Link>
                ))}
                {offers.data.length === 0 && (
                    <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
                        Офферы не найдены
                    </div>
                )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <div>
                    Показано {offers.from}–{offers.to} из {offers.total}
                </div>
                <div className="flex flex-wrap gap-1">
                    {offers.links?.map((link, idx) => {
                        let label = link.label;
                        if (label.includes('Previous')) label = 'Предыдущая';
                        if (label.includes('Next')) label = 'Следующая';
                        return (
                            <button
                                key={idx}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                className={`rounded px-3 py-1 text-xs font-semibold ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
