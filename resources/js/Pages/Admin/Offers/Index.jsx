import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Index({ offers, categories, filters }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        offer_category_id: categories[0]?.id ?? '',
        name: '',
        slug: '',
        default_payout: '',
        allowed_geos: '',
        description: '',
        notes: '',
        is_active: true,
        image: null,
    });

    const filterForm = useForm({
        search: filters?.search ?? '',
        category_id: filters?.category_id ?? '',
        status: filters?.status ?? '',
        sort: filters?.sort ?? 'name',
        direction: filters?.direction ?? 'asc',
        per_page: filters?.per_page ?? 10,
    });

    const applyFilters = () => {
        filterForm.get(route('admin.offers.index'), {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterForm.data.sort, filterForm.data.direction, filterForm.data.per_page]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.offers.store'), {
            forceFormData: true,
            onSuccess: () =>
                reset(
                    'name',
                    'slug',
                    'default_payout',
                    'allowed_geos',
                    'description',
                    'notes',
                    'image',
                ),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Офферы</h2>}
        >
            <Head title="Офферы" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Новый оффер
                    </h3>
                    <form onSubmit={submit} className="mt-3 space-y-3" encType="multipart/form-data">
                        <select
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.offer_category_id}
                            onChange={(e) =>
                                setData('offer_category_id', e.target.value)
                            }
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Название"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="ID (опционально, генерируется автоматически)"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Ставка (default)"
                            value={data.default_payout}
                            onChange={(e) =>
                                setData('default_payout', e.target.value)
                            }
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Разрешенные GEO (через запятую)"
                            value={data.allowed_geos}
                            onChange={(e) =>
                                setData('allowed_geos', e.target.value)
                            }
                        />
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Описание"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Примечание для партнерской программы"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                        <div>
                            <label className="text-sm text-gray-700">
                                Фото оффера (jpg/png)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                onChange={(e) =>
                                    setData('image', e.target.files?.[0] ?? null)
                                }
                            />
                            {errors.image && (
                                <div className="text-xs text-red-600">{errors.image}</div>
                            )}
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                            />
                            Активен
                        </label>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Создать
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-700">Список офферов</h3>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                <input
                                    className="rounded border px-3 py-2 text-sm"
                                    placeholder="Поиск по названию"
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
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.status}
                                    onChange={(e) => {
                                        filterForm.setData('status', e.target.value);
                                        applyFilters();
                                    }}
                                >
                                    <option value="">Все статусы</option>
                                    <option value="active">Активные</option>
                                    <option value="inactive">Выключенные</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.sort}
                                    onChange={(e) => filterForm.setData('sort', e.target.value)}
                                >
                                    <option value="name">По алфавиту</option>
                                    <option value="default_payout">По ставке</option>
                                    <option value="created_at">По дате добавления</option>
                                    <option value="category">По категории</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.direction}
                                    onChange={(e) => filterForm.setData('direction', e.target.value)}
                                >
                                    <option value="asc">По возрастанию</option>
                                    <option value="desc">По убыванию</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                    Применить
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 divide-y">
                            {offers.data.map((offer) => (
                                <div
                                    key={offer.id}
                                    className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
                                >
                                    <Link
                                        href={route('admin.offers.show', offer.id)}
                                        className="flex flex-1 items-center gap-3"
                                    >
                                        {offer.image_url && (
                                            <img
                                                src={offer.image_url}
                                                alt={offer.name}
                                                className="h-12 w-12 rounded object-contain bg-slate-50"
                                            />
                                        )}
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {offer.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {offer.category?.name} • GEO:{' '}
                                                {(offer.allowed_geos || []).join(
                                                    ', ',
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="flex flex-col items-end gap-1 text-right text-sm">
                                        <div className="font-semibold text-gray-900">{offer.default_payout} $</div>
                                        <div className="text-xs text-gray-500">Добавлен: {offer.created_at_human}</div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={route('admin.offers.show', offer.id)}
                                                className="rounded border border-indigo-200 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                                            >
                                                Редактировать
                                            </Link>
                                            <form
                                                method="post"
                                                action={route('admin.offers.toggle', offer.id)}
                                            >
                                                <input type="hidden" name="_method" value="patch" />
                                                <button
                                                    type="submit"
                                                    className="rounded border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                                                >
                                                    {offer.is_active ? 'Отключить' : 'Включить'}
                                                </button>
                                            </form>
                                            <form
                                                method="post"
                                                action={route('admin.offers.destroy', offer.id)}
                                                onSubmit={(e) => {
                                                    if (!confirm('Удалить оффер?')) e.preventDefault();
                                                }}
                                            >
                                                <input type="hidden" name="_method" value="delete" />
                                                <button
                                                    type="submit"
                                                    className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Удалить
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {offers.data.length === 0 && (
                                <div className="py-6 text-center text-sm text-gray-500">Нет офферов по фильтрам</div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <div>
                                Показано {offers.from}–{offers.to} из {offers.total}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">На странице:</span>
                                <select
                                    className="rounded border px-2 py-1 text-sm"
                                    value={filterForm.data.per_page}
                                    onChange={(e) => filterForm.setData('per_page', e.target.value)}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
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
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
