import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Index({ payouts, balance }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        amount: '',
        method: 'USDT TRC20',
        details: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('webmaster.payouts.store'), {
            onSuccess: () => reset('amount', 'details'),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Выплаты</h2>}
        >
            <Head title="Выплаты" />

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-700">
                        Доступно к выводу:{' '}
                        <span className="font-semibold text-indigo-700">
                            {balance} $
                        </span>
                    </div>
                    <form onSubmit={submit} className="mt-3 space-y-3">
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Сумма"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                        />
                        {errors.amount && (
                            <div className="text-xs text-red-600">{errors.amount}</div>
                        )}
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Метод"
                            value={data.method}
                            onChange={(e) => setData('method', e.target.value)}
                        />
                        <textarea
                            className="w-full rounded border px-3 py-2"
                            placeholder="Реквизиты/комментарий"
                            value={data.details}
                            onChange={(e) =>
                                setData('details', e.target.value)
                            }
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Отправить заявку
                        </button>
                    </form>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        История заявок
                    </h3>
                    <div className="mt-3 divide-y text-sm text-gray-700">
                        {payouts.map((payout) => (
                            <div key={payout.id} className="flex items-center justify-between py-2">
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {payout.amount} $
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {payout.method}
                                    </div>
                                </div>
                                <div className="rounded bg-gray-100 px-2 py-1 text-xs uppercase text-gray-700">
                                    {payout.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
