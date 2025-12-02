import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({
    totalLeads,
    statusCounts,
    salesCount,
    totalPayout,
    kpi,
    topOffers,
    topWebmasters,
    chartData,
}) {
    const statusList = ['new', 'in_work', 'sale', 'cancel', 'trash'];

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Дашборд ПП</h2>}
        >
            <Head title="Дашборд" />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Всего лидов" value={totalLeads} />
                <StatCard title="Продажи" value={salesCount} />
                <StatCard title="Payout за период" value={`${totalPayout} $`} />
                <StatCard title="Конверсия" value={`${kpi.conversion}%`} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Статусы лидов
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {statusList.map((status) => (
                            <div
                                key={status}
                                className="rounded-lg border p-3 text-sm"
                            >
                                <div className="text-gray-500">{status}</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {statusCounts?.[status] ?? 0}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        KPI
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <StatCard
                            title="Конверсия в sale"
                            value={`${kpi.conversion}%`}
                        />
                        <StatCard
                            title="Апрув"
                            value={`${kpi.approve}%`}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <ListCard title="Топ офферы" items={topOffers?.map((o) => ({
                    title: o.offer?.name ?? '—',
                    value: `${o.total} продаж`,
                }))} />

                <ListCard title="Топ вебмастера" items={topWebmasters?.map((w) => ({
                    title: w.webmaster?.name ?? '—',
                    value: `${w.total_payout} $`,
                }))} />
            </div>

            <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700">
                    Динамика по дням
                </h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="font-semibold">Дата</div>
                    <div className="font-semibold text-right">Лиды</div>
                    <div className="font-semibold text-right">Payout</div>
                    {chartData?.map((row) => (
                        <>
                            <div key={`${row.date}-d`}>{row.date}</div>
                            <div key={`${row.date}-l`} className="text-right">
                                {row.leads_count}
                            </div>
                            <div key={`${row.date}-p`} className="text-right">
                                {row.payout_sum ?? 0}
                            </div>
                        </>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-gray-500">{title}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
                {value}
            </div>
        </div>
    );
}

function ListCard({ title, items = [] }) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
            <div className="mt-3 space-y-2">
                {items.length === 0 && (
                    <div className="text-sm text-gray-500">Нет данных</div>
                )}
                {items.map((item, idx) => (
                    <div
                        key={`${item.title}-${idx}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                        <div className="text-sm text-gray-800">{item.title}</div>
                        <div className="text-sm font-semibold text-gray-900">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
