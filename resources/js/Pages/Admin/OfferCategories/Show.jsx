import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Show({ category, offers, filters, attachOffers, attachFilters, attachedIds }) {
    const listForm = useForm({
        search: filters?.search ?? '',
        status: filters?.status ?? '',
        sort: filters?.sort ?? 'name',
        direction: filters?.direction ?? 'asc',
        per_page: filters?.per_page ?? 10,
    });

    const attachForm = useForm({
        attach_search: attachFilters?.attach_search ?? '',
        attach_status: attachFilters?.attach_status ?? '',
        attach_per_page: attachFilters?.attach_per_page ?? 10,
    });

    const applyListFilters = () => {
        listForm.get(route('admin.offer-categories.show', category.id), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            data: { ...listForm.data, ...attachForm.data },
        });
    };

    const applyAttachFilters = () => {
        attachForm.get(route('admin.offer-categories.show', category.id), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            data: { ...listForm.data, ...attachForm.data },
        });
    };

    useEffect(() => {
        applyListFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listForm.data.sort, listForm.data.direction, listForm.data.per_page, listForm.data.status]);

    useEffect(() => {
        applyAttachFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attachForm.data.attach_per_page, attachForm.data.attach_status]);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Категория: {category.name}</h2>}
        >
            <Head title={`Категория ${category.name}`} />

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600">
                    ID: {category.id} • {category.slug || 'ID не задан'} • {category.is_active ? 'Активна' : 'Выключена'}
                </div>
                <Link
                    href={route('admin.offer-categories.index')}
                    className="rounded border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Назад к списку
                </Link>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Офферы в категории</h3>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <input
                            className="rounded border px-3 py-2 text-sm"
                            placeholder="Поиск по названию"
                            value={listForm.data.search}
                            onChange={(e) => {
                                listForm.setData('search', e.target.value);
                            }}
                            onBlur={applyListFilters}
                            onKeyDown={(e) => e.key === 'Enter' && applyListFilters()}
                        />
                        <select
                            className="rounded border px-3 py-2 text-sm"
                            value={listForm.data.status}
                            onChange={(e) => {
                                listForm.setData('status', e.target.value);
                                applyListFilters();
                            }}
                        >
                            <option value="">Все статусы</option>
                            <option value="active">Активные</option>
                            <option value="inactive">Выключенные</option>
                        </select>
                        <select
                            className="rounded border px-3 py-2 text-sm"
                            value={listForm.data.sort}
                            onChange={(e) => {
                                listForm.setData('sort', e.target.value);
                                applyListFilters();
                            }}
                        >
                            <option value="name">По алфавиту</option>
                            <option value="default_payout">По ставке</option>
                            <option value="created_at">По дате</option>
                        </select>
                        <select
                            className="rounded border px-3 py-2 text-sm"
                            value={listForm.data.direction}
                            onChange={(e) => {
                                listForm.setData('direction', e.target.value);
                                applyListFilters();
                            }}
                        >
                            <option value="asc">По возрастанию</option>
                            <option value="desc">По убыванию</option>
                        </select>
                    </div>
                    <div className="mt-3 divide-y">
                        {offers.data.map((offer) => (
                            <div key={offer.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                                <div>
                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                        <span>{offer.name}</span>
                                        {!offer.is_active && (
                                            <span className="rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                                                выключен
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        GEO: {(offer.allowed_geos || []).join(', ') || '—'} • Ставка: {offer.default_payout} $
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={route('admin.offers.show', offer.id)}
                                        className="rounded border border-indigo-200 px-3 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                                    >
                                        Открыть
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('Удалить оффер из категории?')) {
                                                router.delete(route('admin.offer-categories.detach', category.id), {
                                                    data: { offer_id: offer.id },
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                });
                                            }
                                        }}
                                        className="rounded border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                                    >
                                        Удалить из категории
                                    </button>
                                </div>
                            </div>
                        ))}
                        {offers.data.length === 0 && (
                            <div className="py-4 text-center text-sm text-gray-500">
                                Нет офферов в категории
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <div>Показано {offers.from}–{offers.to} из {offers.total}</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">На странице:</span>
                            <select
                                className="rounded border px-2 pr-8 py-1 text-sm"
                                value={listForm.data.per_page}
                                onChange={(e) => listForm.setData('per_page', e.target.value)}
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

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">Добавить офферы</h3>
                            <p className="text-xs text-gray-500">Доступные офферы для добавления в эту категорию</p>
                        </div>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <input
                            className="rounded border px-3 py-2 text-sm"
                            placeholder="Поиск офферов"
                            value={attachForm.data.attach_search}
                            onChange={(e) => {
                                attachForm.setData('attach_search', e.target.value);
                            }}
                            onBlur={applyAttachFilters}
                            onKeyDown={(e) => e.key === 'Enter' && applyAttachFilters()}
                        />
                        <select
                            className="rounded border px-3 py-2 text-sm"
                            value={attachForm.data.attach_status}
                            onChange={(e) => {
                                attachForm.setData('attach_status', e.target.value);
                                applyAttachFilters();
                            }}
                        >
                            <option value="">Все статусы</option>
                            <option value="active">Активные</option>
                            <option value="inactive">Выключенные</option>
                        </select>
                        <select
                            className="rounded border px-3 py-2 text-sm"
                            value={attachForm.data.attach_per_page}
                            onChange={(e) => attachForm.setData('attach_per_page', e.target.value)}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <button
                            type="button"
                            onClick={applyAttachFilters}
                            className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                            Применить
                        </button>
                    </div>
                    <div className="mt-3 divide-y">
                        {attachOffers.data.map((offer) => {
                            const already = attachedIds.includes(offer.id);
                            return (
                                <div key={offer.id} className="flex items-center justify-between py-2 text-sm">
                                    <div>
                                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                                            <span>{offer.name}</span>
                                            {!offer.is_active && (
                                                <span className="rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-600">выключен</span>
                                            )}
                                            {already && (
                                                <span className="rounded bg-green-100 px-2 py-1 text-[11px] text-green-700">уже в категории</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {(offer.categories || []).map((c) => c.name).join(', ') || 'Без категории'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {already ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Удалить оффер из категории?')) {
                                                        router.delete(route('admin.offer-categories.detach', category.id), {
                                                            data: { offer_id: offer.id },
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        });
                                                    }
                                                }}
                                                className="rounded border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                                            >
                                                Удалить
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => router.post(route('admin.offer-categories.attach', category.id), { offer_id: offer.id }, { preserveScroll: true, preserveState: true })}
                                                className="rounded border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100"
                                            >
                                                Добавить
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {attachOffers.data.length === 0 && (
                            <div className="py-4 text-center text-sm text-gray-500">
                                Нет офферов
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                        <div>Показано {attachOffers.from}–{attachOffers.to} из {attachOffers.total}</div>
                        <div className="flex flex-wrap gap-1">
                            {attachOffers.links?.map((link, idx) => {
                                let label = link.label;
                                if (label.includes('Previous')) label = 'Предыдущая';
                                if (label.includes('Next')) label = 'Следующая';
                                return (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                        className={`rounded px-3 py-1 font-semibold ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
