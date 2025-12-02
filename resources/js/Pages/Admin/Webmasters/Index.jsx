import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Index({ webmasters }) {
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.webmasters.store'), {
            onSuccess: () => reset('name', 'email', 'password'),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Вебмастера</h2>}
        >
            <Head title="Вебмастера" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Создать вебмастера
                    </h3>
                    <form onSubmit={submit} className="mt-3 space-y-3">
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Имя"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Пароль (опционально)"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
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
                            Список
                        </h3>
                        <div className="mt-3 divide-y">
                            {webmasters.data.map((wm) => (
                                <div
                                    key={wm.id}
                                    className="flex items-center justify-between py-3 transition hover:bg-slate-50"
                                >
                                    <Link
                                        href={route('admin.webmasters.show', wm.id)}
                                        className="flex flex-1 items-center justify-between"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {wm.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {wm.email}
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-gray-600">
                                            <div>Лиды: {wm.leads_count}</div>
                                            <div>Продажи: {wm.sales_count}</div>
                                            <div>
                                                Баланс:{' '}
                                                <span className="font-semibold text-gray-900">
                                                    {wm.balance ?? 0} $
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    <form
                                        method="post"
                                        action={route('admin.webmasters.destroy', wm.id)}
                                        onSubmit={(e) => {
                                            if (!confirm('Удалить вебмастера?')) e.preventDefault();
                                        }}
                                    >
                                        <input type="hidden" name="_method" value="delete" />
                                        <button
                                            type="submit"
                                            className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                                        >
                                            Удалить
                                        </button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
