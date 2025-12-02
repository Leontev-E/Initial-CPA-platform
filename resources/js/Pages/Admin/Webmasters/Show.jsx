import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Show({ webmaster, stats, balance }) {
    const { data, setData, patch, processing } = useForm({
        is_active: webmaster.is_active,
    });

    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
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

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">{webmaster.name}</h2>}
        >
            <Head title={webmaster.name} />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                    <div className="text-sm text-gray-700">Email: {webmaster.email ?? '—'}</div>
                    <div className="text-sm text-gray-700">Telegram: {webmaster.telegram ?? '—'}</div>
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
                            Сохранить статус
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
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div>Лиды: {stats.leads}</div>
                        <div>Продажи: {stats.sales}</div>
                        <div>Payout: {stats.payout} $</div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Индивидуальные ставки
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        {webmaster.rates?.map((rate) => (
                            <div
                                key={rate.id}
                                className="flex items-center justify-between rounded border px-3 py-2"
                            >
                                <div>{rate.offer?.name}</div>
                                <div className="font-semibold">
                                    {rate.custom_payout} $
                                </div>
                            </div>
                        ))}
                        {webmaster.rates?.length === 0 && (
                            <div className="text-gray-500">Нет индивидуальных ставок</div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
