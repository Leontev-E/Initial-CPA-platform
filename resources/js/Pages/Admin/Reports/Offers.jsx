import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Offers({ rows }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Отчет по офферам</h2>}
        >
            <Head title="Отчет по офферам" />
            <ReportTable rows={rows} />
        </AuthenticatedLayout>
    );
}

function ReportTable({ rows }) {
    const headers = [
        'Оффер',
        'Лиды',
        'Продажи',
        'Cancel+Trash',
        'Конверсия %',
        'Апрув %',
        'Payout суммарно',
        'Средний payout',
    ];

    return (
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
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td className="px-3 py-2">{row.offer}</td>
                            <td className="px-3 py-2">{row.leads}</td>
                            <td className="px-3 py-2">{row.sales}</td>
                            <td className="px-3 py-2">{row.rejected}</td>
                            <td className="px-3 py-2">{row.conversion}</td>
                            <td className="px-3 py-2">{row.approve}</td>
                            <td className="px-3 py-2">{row.payout_sum}</td>
                            <td className="px-3 py-2">{row.avg_payout}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
