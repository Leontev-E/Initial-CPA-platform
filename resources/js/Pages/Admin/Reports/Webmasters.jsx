import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Webmasters({ rows, filters, offers, geos }) {
    const filterForm = useForm({
        offer_id: filters?.offer_id ?? '',
        geo: filters?.geo ?? '',
        date_from: filters?.date_from ?? '',
        date_to: filters?.date_to ?? '',
        sort: filters?.sort ?? 'leads',
        direction: filters?.direction ?? 'desc',
        per_page: filters?.per_page ?? 10,
    });

    const applyFilters = () => {
        filterForm.get(route('admin.reports.webmasters'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterForm.data.sort, filterForm.data.direction, filterForm.data.per_page]);

    const exportUrl = route('admin.reports.webmasters', { ...filterForm.data, export: 1 });

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Отчет по вебмастерам</h2>}
        >
            <Head title="Отчет по вебмастерам" />
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
                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        <select
                            className="rounded border px-3 py-2 text-sm"
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
                        <select
                            className="rounded border px-3 py-2 text-sm"
                            value={filterForm.data.geo}
                            onChange={(e) => {
                                filterForm.setData('geo', e.target.value);
                                applyFilters();
                            }}
                        >
                            <option value="">Все GEO</option>
                            {geos.map((geo) => (
                                <option key={geo} value={geo}>{geo}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="rounded border px-3 py-2 text-sm"
                            value={filterForm.data.date_from}
                            onChange={(e) => filterForm.setData('date_from', e.target.value)}
                        />
                        <input
                            type="date"
                            className="rounded border px-3 py-2 text-sm"
                            value={filterForm.data.date_to}
                            onChange={(e) => filterForm.setData('date_to', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                className="rounded border px-3 py-2 text-sm"
                                value={filterForm.data.sort}
                                onChange={(e) => filterForm.setData('sort', e.target.value)}
                            >
                                <option value="leads">По лидам</option>
                                <option value="sales">По продажам</option>
                                <option value="rejected">По отказам</option>
                                <option value="payout_sum">По выплатам</option>
                                <option value="conversion">По конверсии</option>
                                <option value="approve">По апруву</option>
                                <option value="webmaster">По вебмастеру</option>
                            </select>
                            <select
                                className="rounded border px-3 py-2 text-sm"
                                value={filterForm.data.direction}
                                onChange={(e) => filterForm.setData('direction', e.target.value)}
                            >
                                <option value="desc">По убыванию</option>
                                <option value="asc">По возрастанию</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                            className="rounded border px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            Сбросить
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold uppercase text-gray-600">
                                <th className="px-3 py-2">Вебмастер</th>
                                <th className="px-3 py-2">Лиды</th>
                                <th className="px-3 py-2">Продажи</th>
                                <th className="px-3 py-2">Cancel+Trash</th>
                                <th className="px-3 py-2">Конверсия %</th>
                                <th className="px-3 py-2">Апрув %</th>
                                <th className="px-3 py-2">Payout</th>
                                <th className="px-3 py-2">Средний payout</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm text-gray-700">
                            {rows.data.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="px-3 py-2">{row.webmaster}</td>
                                    <td className="px-3 py-2">{row.leads}</td>
                                    <td className="px-3 py-2">{row.sales}</td>
                                    <td className="px-3 py-2">{row.rejected}</td>
                                    <td className="px-3 py-2">{row.conversion}</td>
                                    <td className="px-3 py-2">{row.approve}</td>
                                    <td className="px-3 py-2">{row.payout_sum}</td>
                                    <td className="px-3 py-2">{row.avg_payout}</td>
                                </tr>
                            ))}
                            {rows.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
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
