import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const statuses = [
    { value: 'new', label: 'Новый' },
    { value: 'in_work', label: 'В работе' },
    { value: 'sale', label: 'Продажа' },
    { value: 'cancel', label: 'Отмена' },
    { value: 'trash', label: 'Треш' },
];

export default function Index({ leads, offers, webmasters, filters }) {
    const exportParams = Object.fromEntries(
        Object.entries(filters || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''),
    );

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Лиды</h2>}>
            <Head title="Лиды" />

            <form method="get" className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                    <div className="text-sm font-semibold text-gray-800">Фильтры</div>
                    <Link
                        href={route('admin.leads.export', exportParams)}
                        className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                        Экспорт CSV
                    </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 md:grid-cols-7">
                    <FilterInput
                        name="webmaster_id"
                        defaultValue={filters.webmaster_id}
                        options={webmasters}
                        placeholder="Вебмастер"
                    />
                    <FilterInput
                        name="offer_id"
                        defaultValue={filters.offer_id}
                        options={offers}
                        placeholder="Оффер"
                    />
                    <FilterInput
                        name="status"
                        defaultValue={filters.status}
                        options={statuses}
                        placeholder="Статус"
                    />
                    <FilterField name="geo" defaultValue={filters.geo} placeholder="GEO" />
                    <FilterField name="date_from" defaultValue={filters.date_from} placeholder="Дата от" type="date" />
                    <FilterField name="date_to" defaultValue={filters.date_to} placeholder="Дата до" type="date" />
                    <div className="flex items-end">
                        <button className="w-full rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
                            Показать
                        </button>
                    </div>
                </div>
            </form>

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
