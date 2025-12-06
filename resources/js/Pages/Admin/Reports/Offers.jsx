import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GeoMultiSelect from '@/Components/GeoMultiSelect';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Offers({ rows, filters, offers, geos }) {
    const filterForm = useForm({
        offer_id: filters?.offer_id ?? '',
        geo: filters?.geo ?? [],
        date_from: filters?.date_from ?? '',
        date_to: filters?.date_to ?? '',
        sort: filters?.sort ?? 'leads',
        direction: filters?.direction ?? 'desc',
        per_page: filters?.per_page ?? 10,
        search: filters?.search ?? '',
    });

    const applyFilters = () => {
        filterForm.get(route('admin.reports.offers'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterForm.data.sort, filterForm.data.direction, filterForm.data.per_page]);

    const exportUrl = route('admin.reports.offers', { ...filterForm.data, export: 1 });

    const headers = [
        'Вебмастер',
        'Email',
        'Telegram',
        'Лиды',
        'Новый',
        'В работе',
        'Продажа',
        'Отмена',
        'Треш',
        'Новый %',
        'В работе %',
        'Продажа %',
        'Отмена %',
        'Треш %',
        'Payout суммарно',
    ];

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Отчет по офферам</h2>}
        >
            <Head title="Отчет по офферам" />
            <div className="space-y-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-700">Фильтры</h3>
                        <a
                            href={exportUrl}
                            className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                            Выгрузить CSV
                        </a>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3 items-start">
                        <select
                            className="h-10 rounded border px-3 py-2 text-sm"
                            value={filterForm.data.offer_id}
                            onChange={(e) => {
                                filterForm.setData('offer_id', e.target.value);
                                applyFilters();
                            }}
                        >
                            <option value="">Все офферы</option>
                            {offers.map((offer) => (
                                <option key={offer.id} value={offer.id}>{offer.name}</option>
                            ))}
                        </select>
                        <input
                            className="h-10 rounded border px-3 py-2 text-sm"
                            placeholder="Поиск по вебмастеру/email/Telegram"
                            value={filterForm.data.search}
                            onChange={(e) => {
                                filterForm.setData('search', e.target.value);
                            }}
                            onBlur={applyFilters}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                        <GeoMultiSelect
                            value={filterForm.data.geo}
                            onChange={(vals) => {
                                filterForm.setData('geo', vals);
                                applyFilters();
                            }}
                            placeholder=""
                            emptyLabel="Все GEO"
                            className="h-full md:h-10"
                        />
                        <input
                            type="date"
                            className="h-10 rounded border px-3 py-2 text-sm"
                            value={filterForm.data.date_from}
                            onChange={(e) => {
                                filterForm.setData('date_from', e.target.value);
                                applyFilters();
                            }}
                        />
                        <input
                            type="date"
                            className="h-10 rounded border px-3 py-2 text-sm"
                            value={filterForm.data.date_to}
                            onChange={(e) => {
                                filterForm.setData('date_to', e.target.value);
                                applyFilters();
                            }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                className="h-10 rounded border px-3 py-2 text-sm"
                                value={filterForm.data.sort}
                                onChange={(e) => {
                                    filterForm.setData('sort', e.target.value);
                                    applyFilters();
                                }}
                            >
                                <option value="leads">По лидам</option>
                                <option value="sale">По продажам</option>
                                <option value="payout_sum">По выплатам</option>
                                <option value="trash">По трешу</option>
                                <option value="webmaster">По имени</option>
                            </select>
                            <select
                                className="h-10 rounded border px-3 py-2 text-sm"
                                value={filterForm.data.direction}
                                onChange={(e) => {
                                    filterForm.setData('direction', e.target.value);
                                    applyFilters();
                                }}
                            >
                                <option value="desc">По убыванию</option>
                                <option value="asc">По возрастанию</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {(filterForm.data.offer_id || filterForm.data.search || (filterForm.data.geo || []).length > 0 || filterForm.data.date_from || filterForm.data.date_to || filterForm.data.sort !== 'leads' || filterForm.data.direction !== 'desc' || filterForm.data.per_page !== 10) && (
                            <button
                                type="button"
                                onClick={() => {
                                    filterForm.reset();
                                    filterForm.setData({
                                        offer_id: '',
                                        search: '',
                                        geo: '',
                                        date_from: '',
                                        date_to: '',
                                        sort: 'leads',
                                        direction: 'desc',
                                        per_page: 10,
                                    });
                                    applyFilters();
                                }}
                                className="rounded border px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Сбросить
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold uppercase text-gray-600">
                                {headers.map((h) => (
                                    <th key={h} className="px-3 py-2">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm text-gray-700">
                            {rows.data.map((row, idx) => (
                                <tr
                                    key={idx}
                                    className={`hover:bg-slate-50 ${row.webmaster_id ? 'cursor-pointer' : 'opacity-60'}`}
                                    onClick={() => row.webmaster_id && router.visit(route('admin.reports.offers.webmaster', { webmaster: row.webmaster_id }))}
                                >
                                    <td className="px-3 py-2">{row.webmaster}</td>
                                    <td className="px-3 py-2 text-xs text-gray-500">{row.email ?? '—'}</td>
                                    <td className="px-3 py-2 text-xs text-gray-500">{row.telegram ?? '—'}</td>
                                    <td className="px-3 py-2">{row.leads}</td>
                                    <td className="px-3 py-2">{row.new} ({row.pct_new}%)</td>
                                    <td className="px-3 py-2">{row.in_work} ({row.pct_in_work}%)</td>
                                    <td className="px-3 py-2">{row.sale} ({row.pct_sale}%)</td>
                                    <td className="px-3 py-2">{row.cancel} ({row.pct_cancel}%)</td>
                                    <td className="px-3 py-2">{row.trash} ({row.pct_trash}%)</td>
                                    <td className="px-3 py-2">{row.pct_new}%</td>
                                    <td className="px-3 py-2">{row.pct_in_work}%</td>
                                    <td className="px-3 py-2">{row.pct_sale}%</td>
                                    <td className="px-3 py-2">{row.pct_cancel}%</td>
                                    <td className="px-3 py-2">{row.pct_trash}%</td>
                                    <td className="px-3 py-2">{row.payout_sum}</td>
                                </tr>
                            ))}
                            {rows.data.length === 0 && (
                                <tr>
                                    <td colSpan={headers.length} className="px-3 py-4 text-center text-sm text-gray-500">
                                        Нет данных по фильтрам
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                    <div>
                        Показано {rows.from}–{rows.to} из {rows.total}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">На странице:</span>
                        <select
                            className="rounded border px-2 pr-8 py-1 text-sm"
                            value={filterForm.data.per_page}
                            onChange={(e) => filterForm.setData('per_page', e.target.value)}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {rows.links?.map((link, idx) => {
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
        </AuthenticatedLayout>
    );
}
