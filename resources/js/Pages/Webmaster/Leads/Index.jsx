import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GeoMultiSelect from '@/Components/GeoMultiSelect';
import { Head, router, useForm } from '@inertiajs/react';

const statuses = [
    { value: 'new', label: 'Новый' },
    { value: 'in_work', label: 'В работе' },
    { value: 'sale', label: 'Продажа' },
    { value: 'cancel', label: 'Отмена' },
    { value: 'trash', label: 'Треш' },
];

export default function Index({ leads, offers, filters, summary }) {
    const filterForm = useForm({
        status: filters.status || '',
        offer_id: filters.offer_id || '',
        geos: filters.geos || (filters.geo ? [filters.geo] : []),
        subid: filters.subid || '',
        utm_source: filters.utm_source || '',
        utm_campaign: filters.utm_campaign || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const applyFilters = () => {
        router.get(route('webmaster.leads.index'), filterForm.data, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        filterForm.setData({
            status: '',
            offer_id: '',
            geos: [],
            subid: '',
            utm_source: '',
            utm_campaign: '',
            date_from: '',
            date_to: '',
        });
        router.get(route('webmaster.leads.index'), {}, { preserveScroll: true, preserveState: true, replace: true });
    };

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

            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3 text-sm">
                    <FilterSelect
                        label="Статус"
                        value={filterForm.data.status}
                        onChange={(val) => filterForm.setData('status', val)}
                        options={statuses}
                        placeholder="Все"
                    />
                    <FilterSelect
                        label="Оффер"
                        value={filterForm.data.offer_id}
                        onChange={(val) => filterForm.setData('offer_id', val)}
                        options={offers}
                        labelKey="name"
                        valueKey="id"
                        placeholder="Все"
                    />
                    <div className="min-w-[220px] flex-1">
                        <GeoMultiSelect
                            value={filterForm.data.geos}
                            onChange={(vals) => filterForm.setData('geos', vals)}
                            placeholder="GEO"
                            emptyLabel="Все GEO"
                            className="h-10"
                        />
                    </div>
                    <FilterField
                        label="Subid"
                        value={filterForm.data.subid}
                        onChange={(e) => filterForm.setData('subid', e.target.value)}
                    />
                    <FilterField
                        label="UTM Source"
                        value={filterForm.data.utm_source}
                        onChange={(e) => filterForm.setData('utm_source', e.target.value)}
                    />
                    <FilterField
                        label="UTM Campaign"
                        value={filterForm.data.utm_campaign}
                        onChange={(e) => filterForm.setData('utm_campaign', e.target.value)}
                    />
                    <FilterField
                        label="Дата от"
                        type="date"
                        value={filterForm.data.date_from}
                        onChange={(e) => filterForm.setData('date_from', e.target.value)}
                    />
                    <FilterField
                        label="Дата до"
                        type="date"
                        value={filterForm.data.date_to}
                        onChange={(e) => filterForm.setData('date_to', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="h-10 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Применить
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="h-10 rounded border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm hidden md:block">
                <div className="flex justify-end px-3 py-3">
                    <a
                        href={route('webmaster.leads.export', filterForm.data)}
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
            <div className="mt-4 space-y-3 md:hidden">
                {leads.data.map((lead) => (
                    <div key={lead.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{lead.created_at}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-gray-700">{lead.status}</span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-gray-900">{lead.offer?.name}</div>
                        <div className="text-xs text-gray-500">GEO: {lead.geo} · Subid: {lead.subid || '—'}</div>
                        <div className="mt-1 text-xs text-gray-600">Payout: {lead.payout ?? '–'}</div>
                        <div className="mt-1 text-sm text-gray-800">{lead.customer_name}</div>
                    </div>
                ))}
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

function FilterField({ label, value, onChange, type = 'text' }) {
    return (
        <label className="flex flex-col min-w-[160px]">
            <span className="text-[11px] uppercase text-gray-500">{label}</span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="h-10 rounded border px-3 text-sm"
            />
        </label>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
    labelKey = 'label',
    valueKey = 'value',
    placeholder = 'Все',
}) {
    return (
        <label className="flex flex-col min-w-[180px]">
            <span className="text-[11px] uppercase text-gray-500">{label}</span>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 rounded border px-3 text-sm"
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o[valueKey] || o} value={o[valueKey] || o}>
                        {o[labelKey] || o}
                    </option>
                ))}
            </select>
        </label>
    );
}
