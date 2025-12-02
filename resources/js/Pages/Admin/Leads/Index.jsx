import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const statuses = [
    { value: 'new', label: 'New' },
    { value: 'in_work', label: 'In work' },
    { value: 'sale', label: 'Sale' },
    { value: 'cancel', label: 'Cancel' },
    { value: 'trash', label: 'Trash' },
];

export default function Index({ leads, offers, webmasters, filters }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Лиды</h2>}
        >
            <Head title="Лиды" />

            <form method="get" className="rounded-xl bg-white p-4 shadow-sm">
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
                            Фильтр
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
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Payout</th>
                            <th className="px-3 py-2">Subid</th>
                            <th className="px-3 py-2">Имя</th>
                            <th className="px-3 py-2"></th>
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
    const { data, setData, patch, processing } = useForm({
        status: lead.status,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.leads.updateStatus', lead.id));
    };

    return (
        <tr className="text-sm text-gray-700">
            <td className="px-3 py-2">{lead.created_at}</td>
            <td className="px-3 py-2">{lead.webmaster?.name}</td>
            <td className="px-3 py-2">{lead.offer?.name}</td>
            <td className="px-3 py-2">{lead.geo}</td>
            <td className="px-3 py-2">
                <form onSubmit={submit} className="flex items-center gap-2">
                    <select
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="rounded border px-2 py-1 text-xs"
                    >
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
                    >
                        OK
                    </button>
                </form>
            </td>
            <td className="px-3 py-2">{lead.payout ?? '—'}</td>
            <td className="px-3 py-2">{lead.subid}</td>
            <td className="px-3 py-2">{lead.customer_name}</td>
            <td className="px-3 py-2 text-right text-xs text-gray-500">
                {lead.utm_source}
            </td>
        </tr>
    );
}

function FilterField({ name, defaultValue, placeholder, type = 'text' }) {
    return (
        <label className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">
                {placeholder}
            </span>
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
                    <option key={o.id || o.value} value={o.id || o.value}>
                        {o.name || o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
