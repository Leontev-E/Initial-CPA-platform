import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Webmasters({ rows }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Отчет по вебмастерам</h2>}
        >
            <Head title="Отчет по вебмастерам" />
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
                        {rows.map((row, idx) => (
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
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
