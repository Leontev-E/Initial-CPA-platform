import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import GeoMultiSelect from '@/Components/GeoMultiSelect';

const statuses = [
    { value: 'new', label: 'Новый' },
    { value: 'in_work', label: 'В работе' },
    { value: 'sale', label: 'Продажа' },
    { value: 'cancel', label: 'Отмена' },
    { value: 'trash', label: 'Треш' },
];

export default function Index({ leads, offers, webmasters, filters, geos }) {
    const filterForm = useForm({
        webmaster_id: filters?.webmaster_id ?? '',
        offer_id: filters?.offer_id ?? '',
        status: filters?.status ?? '',
        geo: filters?.geo ?? [],
        date_from: filters?.date_from ?? '',
        date_to: filters?.date_to ?? '',
        category_id: filters?.category_id ?? '',
    });

    const applyFilters = (nextData = null) => {
        const payload = nextData ?? filterForm.data;
        router.get(route('admin.leads.index'), payload, {
            preserveScroll: true,
            replace: true,
            preserveState: false,
        });
    };

    const exportParams = Object.fromEntries(
        Object.entries(filterForm.data || {}).filter(([, v]) => !(Array.isArray(v) ? v.length === 0 : (v === null || v === undefined || v === ''))),
    );

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Лиды</h2>}>
            <Head title="Лиды" />

            <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                    <div className="text-sm font-semibold text-gray-800">Фильтры</div>
                    <a
                        href={route('admin.leads.export', exportParams)}
                        className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                        Экспорт CSV
                    </a>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400">Вебмастер</span>
                        <select
                            className="rounded border px-2 py-2 text-sm"
                            value={filterForm.data.webmaster_id}
                            onChange={(e) => {
                                filterForm.setData('webmaster_id', e.target.value);
                                applyFilters();
                            }}
                        >
                            <option value="">Все</option>
                            {webmasters.map((o) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400">Оффер</span>
                        <select
                            className="rounded border px-2 py-2 text-sm"
                            value={filterForm.data.offer_id}
                            onChange={(e) => {
                                filterForm.setData('offer_id', e.target.value);
                                applyFilters();
                            }}
                        >
                            <option value="">Все</option>
                            {offers.map((o) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400">Статус</span>
                        <select
                            className="rounded border px-2 py-2 text-sm"
                            value={filterForm.data.status}
                            onChange={(e) => {
                                filterForm.setData('status', e.target.value);
                                applyFilters();
                            }}
                        >
                            <option value="">Все</option>
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <GeoMultiSelect
                        value={filterForm.data.geo}
                        onChange={(vals) => {
                            filterForm.setData('geo', vals);
                            applyFilters({ ...filterForm.data, geo: vals });
                        }}
                        placeholder="GEO"
                        emptyLabel="Все GEO"
                        className="md:col-span-2 lg:col-span-1"
                    />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400">Дата от</span>
                        <input
                            type="date"
                            className="rounded border px-2 py-2 text-sm"
                            value={filterForm.data.date_from}
                            onChange={(e) => {
                                filterForm.setData('date_from', e.target.value);
                                applyFilters();
                            }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400">Дата до</span>
                        <input
                            type="date"
                            className="rounded border px-2 py-2 text-sm"
                            value={filterForm.data.date_to}
                            onChange={(e) => {
                                filterForm.setData('date_to', e.target.value);
                                applyFilters();
                            }}
                        />
                    </div>
                    {(filterForm.data.webmaster_id || filterForm.data.offer_id || filterForm.data.status || (filterForm.data.geo || []).length > 0 || filterForm.data.date_from || filterForm.data.date_to) && (
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    const cleared = {
                                        webmaster_id: '',
                                        offer_id: '',
                                        status: '',
                                        geo: [],
                                        date_from: '',
                                        date_to: '',
                                        category_id: '',
                                    };
                                    filterForm.setData(cleared);
                                    applyFilters(cleared);
                                }}
                                className="w-full rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Сбросить
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                            <th className="px-3 py-2">Дата</th>
                            <th className="px-3 py-2">Вебмастер</th>
                            <th className="px-3 py-2">Оффер</th>
                            <th className="px-3 py-2">GEO</th>
                            <th className="px-3 py-2">Статус</th>
                            <th className="px-3 py-2">Payout</th>
                            <th className="px-3 py-2">ID лида</th>
                            <th className="px-3 py-2">Клиент</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {leads.data.map((lead) => (
                            <LeadRow key={lead.id} lead={lead} />
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}

function LeadRow({ lead }) {
    return (
        <tr
            className="text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
            onClick={() => (window.location = route('admin.leads.show', lead.id))}
        >
            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{formatDate(lead.created_at)}</td>
            <td className="px-3 py-2">{lead.webmaster?.name}</td>
            <td className="px-3 py-2">{lead.offer?.name}</td>
            <td className="px-3 py-2">{lead.geo}</td>
            <td className="px-3 py-2">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${statusColor(lead.status)}`}>
                    {statuses.find((s) => s.value === lead.status)?.label ?? lead.status}
                </span>
            </td>
            <td className="px-3 py-2">{lead.payout ?? '–'}</td>
            <td className="px-3 py-2 font-semibold text-gray-900">{lead.id}</td>
            <td className="px-3 py-2">{lead.customer_name}</td>
        </tr>
    );
}

function formatDate(value) {
    if (!value) return '–';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function statusColor(status) {
    switch (status) {
        case 'new':
            return 'bg-blue-50 text-blue-700';
        case 'in_work':
            return 'bg-amber-50 text-amber-700';
        case 'sale':
            return 'bg-green-50 text-green-700';
        case 'cancel':
            return 'bg-red-50 text-red-700';
        case 'trash':
            return 'bg-gray-100 text-gray-600';
        default:
            return 'bg-slate-100 text-slate-700';
    }
}

function FilterField({ name, defaultValue, placeholder, type = 'text' }) {
    return (
        <label className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">{placeholder}</span>
            <input
                type={type}
                name={name}
                defaultValue={defaultValue}
                className="rounded border px-2 py-1 text-sm"
            />
        </label>
    );
}

function FilterInput({ name, defaultValue, options, placeholder }) {
    return (
        <label className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">{placeholder}</span>
            <select
                name={name}
                defaultValue={defaultValue || ''}
                className="rounded border px-2 py-1 text-sm"
            >
                <option value="">Все</option>
                {options.map((o) => (
                    <option key={o.id || o.value} value={o.id || o.value}>
                        {o.name || o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
