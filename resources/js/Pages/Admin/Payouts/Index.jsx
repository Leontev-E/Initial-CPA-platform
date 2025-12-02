import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const statuses = ['pending', 'in_process', 'paid', 'cancelled'];

export default function Index({ payouts, balances }) {
    const { data, setData, post, processing, reset } = useForm({
        webmaster_id: balances[0]?.id ?? '',
        amount: '',
        method: 'USDT TRC20',
        details: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.payouts.store'), {
            onSuccess: () => reset('amount', 'details'),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Выплаты</h2>}
        >
            <Head title="Выплаты" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Создать выплату
                    </h3>
                    <form onSubmit={submit} className="mt-3 space-y-3">
                        <select
                            className="w-full rounded border px-3 py-2"
                            value={data.webmaster_id}
                            onChange={(e) =>
                                setData('webmaster_id', e.target.value)
                            }
                        >
                            {balances.map((wm) => (
                                <option key={wm.id} value={wm.id}>
                                    {wm.name} ({wm.balance} $)
                                </option>
                            ))}
                        </select>
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Сумма"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                        />
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Метод"
                            value={data.method}
                            onChange={(e) => setData('method', e.target.value)}
                        />
                        <textarea
                            className="w-full rounded border px-3 py-2"
                            placeholder="Детали"
                            value={data.details}
                            onChange={(e) =>
                                setData('details', e.target.value)
                            }
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Создать
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Заявки
                        </h3>
                        <div className="mt-3 divide-y">
                            {payouts.data.map((payout) => (
                                <PayoutRow payout={payout} key={payout.id} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PayoutRow({ payout }) {
    const { data, setData, patch, processing } = useForm({
        status: payout.status,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.payouts.update', payout.id));
    };

    return (
        <div className="flex items-center justify-between py-3 text-sm text-gray-700">
            <div>
                <div className="font-semibold text-gray-900">
                    {payout.webmaster?.name}
                </div>
                <div className="text-xs text-gray-500">
                    {payout.amount} $ • {payout.method}
                </div>
            </div>
            <form onSubmit={submit} className="flex items-center gap-2">
                <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                >
                    {statuses.map((s) => (
                        <option key={s} value={s}>
                            {s}
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
        </div>
    );
}
