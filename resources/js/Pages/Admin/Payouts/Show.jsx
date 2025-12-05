import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

const statuses = [
    { value: 'pending', label: 'В ожидании' },
    { value: 'in_process', label: 'В процессе' },
    { value: 'paid', label: 'Оплачено' },
    { value: 'cancelled', label: 'Отменена' },
];

const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    in_process: 'bg-blue-50 text-blue-700 border border-blue-200',
    paid: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

export default function Show({ payout }) {
    const form = useForm({
        status: payout.status,
        public_comment: payout.public_comment || '',
        internal_comment: payout.internal_comment || '',
    });

    const statusLabel = statuses.find((s) => s.value === payout.status)?.label ?? payout.status;

    const submit = (e) => {
        e.preventDefault();
        form.patch(route('admin.payouts.update', payout.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Выплата #{payout.id}</h2>}>
            <Head title={`Выплата #${payout.id}`} />

            <div className="mb-4 flex items-center gap-2 text-sm">
                <Link href={route('admin.payouts.index')} className="rounded border px-3 py-1 text-gray-700 hover:bg-gray-50">
                    ← Назад
                </Link>
                <span className={`inline-flex items-center gap-2 rounded px-2 py-1 text-[11px] font-semibold uppercase ${statusColors[payout.status] || 'bg-gray-100 text-gray-700 border'}`}>
                    {statusLabel}
                </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-800">Управление</h3>
                    <form onSubmit={submit} className="mt-3 space-y-3 text-sm text-gray-700">
                        <div>
                            <div className="text-xs uppercase text-gray-500">Статус</div>
                            <select
                                className="mt-1 w-full rounded border px-3 py-2"
                                value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value)}
                            >
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Комментарий для вебмастера</div>
                            <textarea
                                className="mt-1 w-full rounded border px-3 py-2"
                                rows={3}
                                value={form.data.public_comment}
                                onChange={(e) => form.setData('public_comment', e.target.value)}
                                placeholder="Этот текст увидит вебмастер в истории выплат"
                            />
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Внутренний комментарий ПП</div>
                            <textarea
                                className="mt-1 w-full rounded border px-3 py-2"
                                rows={3}
                                value={form.data.internal_comment}
                                onChange={(e) => form.setData('internal_comment', e.target.value)}
                                placeholder="Только для сотрудников ПП"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Сохранить
                        </button>
                    </form>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm text-sm text-gray-700 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-800">Информация</h3>
                    <div className="grid gap-2 text-sm">
                        <InfoRow label="Вебмастер" value={payout.webmaster?.name} />
                        <InfoRow label="Email" value={payout.webmaster?.email} />
                        <InfoRow label="Сумма" value={`${payout.amount} $`} />
                        <InfoRow label="Метод" value={payout.method} />
                        <InfoRow label="Кошелек" value={payout.wallet_address || '—'} />
                        <InfoRow label="Создано" value={payout.created_at_human || '—'} />
                        <InfoRow label="Обработано" value={payout.processed_at_human || '—'} />
                        <InfoRow label="Комментарий (вебмастер)" value={payout.public_comment || '—'} multiline />
                        <InfoRow label="Комментарий (ПП)" value={payout.internal_comment || '—'} multiline />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function InfoRow({ label, value, multiline = false }) {
    return (
        <div className="flex flex-col">
            <span className="text-[11px] uppercase text-gray-500">{label}</span>
            <span className={`rounded border px-3 py-2 text-sm ${multiline ? 'whitespace-pre-wrap' : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}
