import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';

export default function Show({ webmaster, stats, balance, offers }) {
    const { data, setData, patch, processing } = useForm({
        is_active: webmaster.is_active,
        name: webmaster.name || '',
        telegram: webmaster.telegram || '',
        note: webmaster.note || '',
        dashboard_message: webmaster.dashboard_message || '',
    });

    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
    });

    const payoutForm = useForm({
        amount: '',
        method: '',
        details: '',
    });

    const deleteForm = useForm({});

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.webmasters.update', webmaster.id));
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.patch(route('admin.webmasters.updatePassword', webmaster.id), {
            onSuccess: () => passwordForm.reset('password', 'password_confirmation'),
        });
    };

    const submitPayout = (e) => {
        e.preventDefault();
        payoutForm.post(route('admin.webmasters.payout', webmaster.id), {
            onSuccess: () => payoutForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">{webmaster.name}</h2>}
        >
            <Head title={webmaster.name} />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                    <div className="text-sm text-gray-700">Email: {webmaster.email ?? '—'}</div>
                    <input
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Имя"
                    />
                    <input
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={data.telegram}
                        onChange={(e) => setData('telegram', e.target.value)}
                        placeholder="Telegram"
                    />
                    <textarea
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={data.note}
                        onChange={(e) => setData('note', e.target.value)}
                        placeholder="Примечание (опционально)"
                    />
                    <textarea
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={data.dashboard_message}
                        onChange={(e) => setData('dashboard_message', e.target.value)}
                        placeholder="Сообщение в шапке кабинета вебмастера"
                    />
                    <div className="text-sm text-gray-700">
                        Баланс: <span className="font-semibold">{balance} $</span>
                    </div>
                    <form onSubmit={submit} className="space-y-2 text-sm">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                            />
                            Активен
                        </label>
                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                            Сохранить
                        </button>
                    </form>
                    <form onSubmit={submitPassword} className="space-y-2 text-sm border-t pt-3">
                        <div className="font-semibold text-gray-800">Сменить пароль</div>
                        <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            placeholder="Новый пароль"
                            value={passwordForm.data.password}
                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                        />
                        <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            placeholder="Подтверждение пароля"
                            value={passwordForm.data.password_confirmation}
                            onChange={(e) =>
                                passwordForm.setData('password_confirmation', e.target.value)
                            }
                        />
                        {passwordForm.errors.password && (
                            <div className="text-xs text-red-600">
                                {passwordForm.errors.password}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={passwordForm.processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                            Обновить пароль
                        </button>
                    </form>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            passwordForm.reset();
                            passwordForm.clearErrors();
                        }}
                        className="space-y-2 text-sm"
                    >
                        <button
                            type="button"
                            onClick={() => passwordForm.post(route('admin.webmasters.resendPassword', webmaster.id))}
                            className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                            disabled={passwordForm.processing}
                        >
                            Отправить новый пароль
                        </button>
                    </form>
                    <div className="border-t pt-3">
                        <button
                            onClick={() => {
                                if (confirm('Удалить вебмастера? Действие нельзя отменить.')) {
                                    deleteForm.delete(route('admin.webmasters.destroy', webmaster.id));
                                }
                            }}
                            className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            disabled={deleteForm.processing}
                        >
                            Удалить вебмастера
                        </button>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Статистика
                    </h3>
                    {(usePage().props.auth.user?.permissions?.actions?.impersonate || usePage().props.auth.user?.invited_by === null) && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() => router.post(route('admin.webmasters.impersonate', webmaster.id))}
                                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                                Войти как вебмастер
                            </button>
                        </div>
                    )}
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div>Лиды: {stats.leads}</div>
                        <div>Продажи: {stats.sales}</div>
                        <div>Payout: {stats.payout} $</div>
                    </div>

                    <div className="mt-4 border-t pt-3">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Создать выплату</div>
                        <form onSubmit={submitPayout} className="space-y-2 text-sm">
                            <input
                                className="w-full rounded border px-3 py-2"
                                placeholder="Сумма"
                                type="number"
                                step="0.01"
                                value={payoutForm.data.amount}
                                onChange={(e) => payoutForm.setData('amount', e.target.value)}
                            />
                            <input
                                className="w-full rounded border px-3 py-2"
                                placeholder="Метод выплаты (например, USDT TRC20)"
                                value={payoutForm.data.method}
                                onChange={(e) => payoutForm.setData('method', e.target.value)}
                            />
                            <textarea
                                className="w-full rounded border px-3 py-2"
                                placeholder="Реквизиты / комментарий"
                                value={payoutForm.data.details}
                                onChange={(e) => payoutForm.setData('details', e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={payoutForm.processing}
                                className="w-full rounded bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                            >
                                Создать заявку на выплату
                            </button>
                        </form>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Индивидуальные ставки и доступы
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        {offers.map((offer) => (
                            <RateRow key={offer.id} offer={offer} webmasterId={webmaster.id} />
                        ))}
                        {offers.length === 0 && (
                            <div className="text-gray-500">Нет офферов</div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function RateRow({ offer, webmasterId }) {
    const form = useForm({
        offer_id: offer.id,
        custom_payout: offer.custom_payout ?? '',
        is_allowed: offer.is_allowed ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('admin.webmasters.rate', webmasterId), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="flex items-center justify-between rounded border px-3 py-2 gap-3">
            <div className="flex-1">
                <div className="font-semibold text-gray-900">
                    {offer.name}{' '}
                    {!offer.is_active && (
                        <span className="rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                            выключен
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                    {(offer.categories || []).map((c) => c.name).join(', ') || 'Без категории'}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <label className="inline-flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={form.data.is_allowed}
                            onChange={(e) => form.setData('is_allowed', e.target.checked)}
                        />
                        Доступен
                    </label>
                    <div className="flex items-center gap-1">
                        <span>Индивидуальная ставка:</span>
                        <input
                            type="number"
                            step="0.01"
                            className="w-24 rounded border px-2 py-1 text-xs"
                            value={form.data.custom_payout}
                            onChange={(e) => form.setData('custom_payout', e.target.value)}
                            placeholder={`${offer.default_payout} $`}
                        />
                        <span>$</span>
                    </div>
                </div>
            </div>
            <button
                type="submit"
                disabled={form.processing}
                className="rounded bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
                Сохранить
            </button>
        </form>
    );
}
