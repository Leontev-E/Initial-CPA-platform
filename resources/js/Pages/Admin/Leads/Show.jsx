import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const statusLabels = {
    new: 'Новый',
    in_work: 'В работе',
    sale: 'Продажа',
    cancel: 'Отмена',
    trash: 'Треш',
};

export default function Show({ lead, statuses }) {
    const form = useForm({
        status: lead.status,
        comment: lead.comment || '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.patch(route('admin.leads.updateStatus', lead.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Лид #{lead.id}</h2>}>
            <Head title={`Лид #${lead.id}`} />

            <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
                <div>{formatDate(lead.created_at)}</div>
                <div className="rounded bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    {statusLabels[lead.status] ?? lead.status}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Статус</label>
                                <select
                                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
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
                                <label className="text-xs font-semibold text-gray-600">Payout</label>
                                <div className="mt-2 rounded border px-3 py-2 text-sm">
                                    {lead.payout ?? '—'} $
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-gray-600">
                                    Комментарий / адрес доставки
                                </label>
                                <textarea
                                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                    rows={3}
                                    value={form.data.comment}
                                    onChange={(e) => form.setData('comment', e.target.value)}
                                    placeholder="Добавьте комментарий по лидy или адрес доставки"
                                />
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Сохранить изменения
                                </button>
                                {form.errors.status && (
                                    <div className="text-xs text-red-600">{form.errors.status}</div>
                                )}
                                {form.errors.comment && (
                                    <div className="text-xs text-red-600">{form.errors.comment}</div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800">Клиент и контакты</h3>
                        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                            <InfoRow label="Имя" value={lead.customer_name} />
                            <InfoRow label="Телефон" value={lead.customer_phone} />
                            <InfoRow label="Email" value={lead.customer_email || '—'} />
                            <InfoRow label="GEO" value={lead.geo} />
                            <InfoRow label="Subid" value={lead.subid || '—'} />
                            <InfoRow label="IP" value={lead.ip || '—'} />
                            <InfoRow label="User Agent" value={lead.user_agent || '—'} />
                            <InfoRow label="Landing URL" value={lead.landing_url || '—'} />
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800">Оффер и источник</h3>
                        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                            <InfoRow label="Оффер" value={lead.offer?.name} />
                            <InfoRow
                                label="Категории"
                                value={(lead.offer?.categories || []).map((c) => c.name).join(', ') || '—'}
                            />
                            <InfoRow label="Вебмастер" value={lead.webmaster?.name} />
                            <InfoRow label="UTM Source" value={lead.utm_source || '—'} />
                            <InfoRow label="UTM Campaign" value={lead.utm_campaign || '—'} />
                            <InfoRow label="UTM Medium" value={lead.utm_medium || '—'} />
                            <InfoRow label="UTM Term" value={lead.utm_term || '—'} />
                            <InfoRow label="UTM Content" value={lead.utm_content || '—'} />
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800">Дополнительно</h3>
                        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                            <InfoRow
                                label="Tags"
                                value={lead.tags ? JSON.stringify(lead.tags, null, 2) : '—'}
                                multiline
                            />
                            <InfoRow
                                label="Доп. данные"
                                value={lead.extra_data ? JSON.stringify(lead.extra_data, null, 2) : '—'}
                                multiline
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800">История статусов</h3>
                        <div className="mt-3 space-y-3 text-sm text-gray-700">
                            {lead.status_logs && lead.status_logs.length > 0 ? (
                                lead.status_logs
                                    .slice()
                                    .reverse()
                                    .map((log) => (
                                        <div key={log.id} className="rounded border px-3 py-2">
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold">
                                                    {statusLabels[log.from_status] ?? log.from_status} →{' '}
                                                    {statusLabels[log.to_status] ?? log.to_status}
                                                </div>
                                                <div className="text-xs text-gray-500">{formatDate(log.created_at)}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {log.user?.name ? `Изменил: ${log.user.name}` : '—'}
                                            </div>
                                            {log.comment && (
                                                <div className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-gray-700">
                                                    {log.comment}
                                                </div>
                                            )}
                                        </div>
                                    ))
                            ) : (
                                <div className="text-xs text-gray-500">Записей пока нет</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function InfoRow({ label, value, multiline = false }) {
    return (
        <div className={`flex flex-col ${multiline ? 'md:col-span-2' : ''}`}>
            <span className="text-[11px] uppercase text-gray-400">{label}</span>
            <span className={`mt-1 rounded border px-3 py-2 text-sm ${multiline ? 'whitespace-pre-wrap' : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}

function formatDate(value) {
    if (!value) return '–';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `Дата: ${dd}.${mm}.${yyyy} · Время: ${hh}:${min}`;
}
