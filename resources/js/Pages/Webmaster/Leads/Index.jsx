import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

const statuses = [
    { value: 'new', label: 'Новый' },
    { value: 'in_work', label: 'В работе' },
    { value: 'sale', label: 'Продажа' },
    { value: 'cancel', label: 'Отмена' },
    { value: 'trash', label: 'Треш' },
];

export default function Index({ leads, offers, filters, summary }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Статистика</h2>}
        >
            <Head title="Статистика" />

            <div className="grid gap-4 md:grid-cols-4">
                <Stat title="Лиды" value={summary.leads} />
                <Stat title="Продажи" value={summary.sales} />
                <Stat title="Апрув" value={`${summary.approve}%`} />
                <Stat title="Payout" value={`${summary.payout} $`} />
            </div>

            <form method="get" className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 md:grid-cols-7">
                    <FilterSelect name="status" options={statuses} placeholder="Статус" defaultValue={filters.status} labelKey="label" valueKey="value" />
                    <FilterSelect name="offer_id" options={offers} placeholder="Оффер" defaultValue={filters.offer_id} labelKey="name" valueKey="id" />
                    <FilterField name="geo" placeholder="GEO" defaultValue={filters.geo} />
                    <FilterField name="subid" placeholder="Subid" defaultValue={filters.subid} />
                    <FilterField name="utm_source" placeholder="UTM Source" defaultValue={filters.utm_source} />
                    <FilterField name="utm_campaign" placeholder="UTM Campaign" defaultValue={filters.utm_campaign} />
                    <div className="flex items-end">
                        <button className="w-full rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
                            Фильтр
                        </button>
                    </div>
                </div>
            </form>

            <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
                <div className="flex justify-end px-3 py-3">
                    <a
                        href={route('webmaster.leads.export', filters)}
                        className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Выгрузить CSV
                    </a>
                </div>
                <table className="min-w-full divide-y">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold uppercase text-gray-600">
                            <th className="px-3 py-2">Дата</th>
                            <th className="px-3 py-2">Оффер</th>
                            <th className="px-3 py-2">GEO</th>
                            <th className="px-3 py-2">Статус</th>
                            <th className="px-3 py-2">Payout</th>
                            <th className="px-3 py-2">Subid</th>
                            <th className="px-3 py-2">Имя</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm text-gray-700">
                        {leads.data.map((lead) => (
                            <tr key={lead.id}>
                                <td className="px-3 py-2">{lead.created_at}</td>
                                <td className="px-3 py-2">{lead.offer?.name}</td>
                                <td className="px-3 py-2">{lead.geo}</td>
                                <td className="px-3 py-2">{lead.status}</td>
                                <td className="px-3 py-2">{lead.payout ?? '—'}</td>
                                <td className="px-3 py-2">{lead.subid}</td>
                                <td className="px-3 py-2">{lead.customer_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}

function Stat({ title, value }) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-gray-500">{title}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
                {value}
            </div>
        </div>
    );
}

function FilterField({ name, defaultValue, placeholder }) {
    return (
        <label className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">
                {placeholder}
            </span>
            <input
                name={name}
                defaultValue={defaultValue}
                className="rounded border px-2 py-1 text-sm"
            />
        </label>
    );
}

function FilterSelect({
    name,
    options,
    placeholder,
    defaultValue,
    labelKey = 'label',
    valueKey = 'value',
}) {
    return (
        <label className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">
                {placeholder}
            </span>
            <select
                name={name}
                defaultValue={defaultValue || ''}
                className="rounded border px-2 py-1 text-sm"
            >
                <option value="">Все</option>
                {options.map((o) => (
                    <option key={o[valueKey] || o} value={o[valueKey] || o}>
                        {o[labelKey] || o}
                    </option>
                ))}
            </select>
        </label>
    );
}
