import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';

const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    in_process: 'bg-blue-50 text-blue-700 border border-blue-200',
    paid: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

export default function Index({ payouts, balance, minPayout, canRequest, filters = {}, methods = [] }) {
    const wallets = usePage().props.auth.user?.payout_wallets ?? [];
    const hasWallets = wallets.length > 0;
    const filterForm = useForm({
        status: filters.status ?? '',
        method: filters.method ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        per_page: filters.per_page ?? 10,
    });

    const { data, setData, post, processing, reset, errors } = useForm({
        amount: '',
        wallet_id: hasWallets ? 0 : null,
    });

    const applyFilters = () => {
        filterForm.get(route('webmaster.payouts.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('webmaster.payouts.store'), {
            onSuccess: () => reset('amount'),
        });
    };

    const formatCurrency = (v) => Number(v ?? 0).toFixed(2);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Выплаты</h2>}
        >
            <Head title="Выплаты" />

            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="text-[11px] uppercase text-gray-500">Статус</div>
                        <select
                            className="mt-1 h-10 w-full rounded border px-3 text-sm"
                            value={filterForm.data.status}
                            onChange={(e) => {
                                filterForm.setData('status', e.target.value);
                                applyFilters();
                            }}
                        >
                            <option value="">Все</option>
                            <option value="pending">pending</option>
                            <option value="in_process">in_process</option>
                            <option value="paid">paid</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase text-gray-500">Метод</div>
                        <select
                            className="mt-1 h-10 w-full rounded border px-3 text-sm"
                            value={filterForm.data.method}
                            onChange={(e) => {
                                filterForm.setData('method', e.target.value);
                                applyFilters();
                            }}
                        >
                            <option value="">Все</option>
                            {methods.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase text-gray-500">Дата с</div>
                        <input
                            type="date"
                            className="mt-1 h-10 w-full rounded border px-3 text-sm"
                            value={filterForm.data.date_from}
                            onChange={(e) => filterForm.setData('date_from', e.target.value)}
                            onBlur={applyFilters}
                        />
                    </div>
                    <div>
                        <div className="text-[11px] uppercase text-gray-500">Дата по</div>
                        <input
                            type="date"
                            className="mt-1 h-10 w-full rounded border px-3 text-sm"
                            value={filterForm.data.date_to}
                            onChange={(e) => filterForm.setData('date_to', e.target.value)}
                            onBlur={applyFilters}
                        />
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-500">На странице</span>
                        <select
                            className="h-9 rounded border px-2 pr-8 text-sm"
                            value={filterForm.data.per_page}
                            onChange={(e) => {
                                filterForm.setData('per_page', Number(e.target.value));
                                applyFilters();
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    {(filterForm.data.status || filterForm.data.method || filterForm.data.date_from || filterForm.data.date_to || filterForm.data.per_page !== 10) && (
                        <button
                            type="button"
                            onClick={() => {
                                filterForm.setData({
                                    status: '',
                                    method: '',
                                    date_from: '',
                                    date_to: '',
                                    per_page: 10,
                                });
                                applyFilters();
                            }}
                            className="rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Сбросить
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                        <div>
                            <div className="text-xs uppercase text-gray-500">Доступно к выводу</div>
                            <span className={`font-semibold ${canRequest ? 'text-green-700' : 'text-gray-500'}`}>
                                {formatCurrency(balance)} $
                            </span>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            Минимум: <span className="font-semibold text-gray-700">{formatCurrency(minPayout)} $</span>
                        </div>
                    </div>
                    {!canRequest && (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            До минимальной суммы осталось {formatCurrency(minPayout - balance)} $
                        </div>
                    )}
                    {!hasWallets && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            Добавьте реквизиты в <Link className="text-indigo-700 underline" href={route('profile.edit')}>личном кабинете</Link>, чтобы отправлять заявки.
                        </div>
                    )}
                    <form onSubmit={submit} className="space-y-3">
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Сумма"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            disabled={!canRequest || !hasWallets}
                        />
                        {errors.amount && (
                            <div className="text-xs text-red-600">{errors.amount}</div>
                        )}
                        <select
                            className="w-full rounded border px-3 py-2"
                            value={data.wallet_id ?? ''}
                            onChange={(e) => setData('wallet_id', Number(e.target.value))}
                            disabled={!canRequest || !hasWallets}
                        >
                            {wallets.map((wallet, idx) => (
                                <option key={idx} value={idx}>
                                    {wallet.type}: {wallet.details}
                                </option>
                            ))}
                        </select>
                        {errors.wallet_id && (
                            <div className="text-xs text-red-600">{errors.wallet_id}</div>
                        )}
                        <button
                            type="submit"
                            disabled={processing || !canRequest || !hasWallets}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${canRequest && hasWallets ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
                        >
                            Отправить заявку
                        </button>
                    </form>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        История заявок
                    </h3>
                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
                                <tr>
                                    <th className="px-3 py-2">Дата</th>
                                    <th className="px-3 py-2">Сумма</th>
                                    <th className="px-3 py-2">Метод</th>
                                    <th className="px-3 py-2">Статус</th>
                                    <th className="px-3 py-2">Комментарий</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payouts?.data?.map((payout) => (
                                    <tr key={payout.id} className="text-gray-700">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                            {payout.created_at_human || '—'}
                                        </td>
                                        <td className="px-3 py-2 font-semibold text-gray-900">
                                            {formatCurrency(payout.amount)} $
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{payout.method}</td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-flex rounded px-2 py-1 text-[11px] font-semibold uppercase ${statusColors[payout.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap">
                                            {payout.public_comment || '—'}
                                        </td>
                                    </tr>
                                ))}
                                {(payouts?.data?.length ?? 0) === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-center text-xs text-gray-500" colSpan={4}>
                                            Заявок пока нет
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {payouts?.links?.map((link, idx) => (
                            <button
                                key={idx}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                className={`rounded px-3 py-1 font-semibold ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                            >
                                {link.label?.replace(/&laquo;|&raquo;/g, '').trim() || idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
