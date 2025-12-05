import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({
    leadsCount,
    sales,
    payoutSum,
    approve,
    balance,
    chartData,
    topOffers,
    dashboardMessage,
}) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Дашборд вебмастера</h2>}
        >
            <Head title="Дашборд" />

            {dashboardMessage && (
                <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                    {dashboardMessage}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Stat title="Сумма заработка" value={`${balance} $`} />
                <Stat title="Лиды" value={leadsCount} />
                <Stat title="Продажи" value={sales} />
                <Stat title="Доход" value={`${payoutSum} $`} />
            </div>

            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700">
                    Динамика
                </h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="font-semibold">Дата</div>
                    <div className="font-semibold text-right">Лиды</div>
                    <div className="font-semibold text-right">Продажи</div>
                    {chartData?.map((row) => (
                        <>
                            <div key={`${row.date}-d`}>{row.date}</div>
                            <div key={`${row.date}-l`} className="text-right">
                                {row.leads_count}
                            </div>
                            <div key={`${row.date}-s`} className="text-right">
                                {row.sales_count}
                            </div>
                        </>
                    ))}
                </div>
            </div>

            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700">
                    Лучшие офферы
                </h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {topOffers?.map((offer) => (
                        <div
                            key={offer.offer_id}
                            className="rounded border px-3 py-2 text-sm text-gray-700"
                        >
                            <div className="font-semibold text-gray-900">
                                {offer.offer?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                                Продаж: {offer.sales}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Stat({ title, value }) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-600">{title}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
                {value}
            </div>
        </div>
    );
}
