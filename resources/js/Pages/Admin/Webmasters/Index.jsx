import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Index({ webmasters, filters }) {
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        email: '',
        telegram: '',
        note: '',
        min_payout: '',
    });

    const filterForm = useForm({
        search: filters?.search ?? '',
        status: filters?.status ?? '',
        sort: filters?.sort ?? 'name',
        direction: filters?.direction ?? 'asc',
        per_page: filters?.per_page ?? 10,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.webmasters.store'), {
            onSuccess: () => reset('name', 'email', 'telegram', 'note'),
        });
    };

    const applyFilters = () => {
        filterForm.get(route('admin.webmasters.index'), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterForm.data.sort, filterForm.data.direction, filterForm.data.per_page, filterForm.data.status]);

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
                            placeholder="Telegram"
                            value={data.telegram}
                            onChange={(e) => setData('telegram', e.target.value)}
                        />
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Примечание (опционально)"
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Минимальная выплата (например, 100)"
                            value={data.min_payout}
                            onChange={(e) => setData('min_payout', e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Создать и отправить пароль
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-700">Список вебмастеров</h3>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                <input
                                    className="rounded border px-3 py-2 text-sm"
                                    placeholder="Поиск (имя/email/Telegram)"
                                    value={filterForm.data.search}
                                    onChange={(e) => {
                                        filterForm.setData('search', e.target.value);
                                    }}
                                    onBlur={applyFilters}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.status}
                                    onChange={(e) => {
                                        filterForm.setData('status', e.target.value);
                                        applyFilters();
                                    }}
                                >
                                    <option value="">Все статусы</option>
                                    <option value="active">Активные</option>
                                    <option value="inactive">Выключенные</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.sort}
                                    onChange={(e) => {
                                        filterForm.setData('sort', e.target.value);
                                        applyFilters();
                                    }}
                                >
                                    <option value="name">По алфавиту</option>
                                    <option value="created_at">По дате регистрации</option>
                                    <option value="leads_count">По лидам</option>
                                    <option value="sales_count">По продажам</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.direction}
                                    onChange={(e) => {
                                        filterForm.setData('direction', e.target.value);
                                        applyFilters();
                                    }}
                                >
                                    <option value="asc">По возрастанию</option>
                                    <option value="desc">По убыванию</option>
                                </select>
                                {(filterForm.data.search || filterForm.data.status || filterForm.data.sort !== 'name' || filterForm.data.direction !== 'asc' || filterForm.data.per_page !== 10) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            filterForm.reset();
                                            filterForm.setData({
                                                search: '',
                                                status: '',
                                                sort: 'name',
                                                direction: 'asc',
                                                per_page: 10,
                                            });
                                            applyFilters();
                                        }}
                                        className="rounded border px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                        Сбросить
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 divide-y">
                            {webmasters.data.map((wm) => (
                                <div
                                    key={wm.id}
                                    className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
                                >
                                    <Link
                                        href={route('admin.webmasters.show', wm.id)}
                                        className="flex flex-1 items-center justify-between"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {wm.name}{' '}
                                                {!wm.is_active && (
                                                    <span className="rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                                                        Выключен
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {wm.email} {wm.telegram ? `• ${wm.telegram}` : ''}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                Регистрация: {wm.created_at_human ?? '—'}
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
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {(usePage().props.auth.user?.permissions?.actions?.impersonate || usePage().props.auth.user?.invited_by === null) && (
                                            <button
                                                type="button"
                                                onClick={() => router.post(route('admin.webmasters.impersonate', wm.id))}
                                                className="rounded border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700 hover:bg-amber-100"
                                            >
                                                Кабинет
                                            </button>
                                        )}
                                        <Link
                                            href={route('admin.webmasters.show', wm.id)}
                                            className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 font-semibold text-indigo-700 hover:bg-indigo-100"
                                        >
                                            Редактировать
                                        </Link>
                                        <form
                                            method="post"
                                            action={route('admin.webmasters.resendPassword', wm.id)}
                                        >
                                            <button
                                                type="submit"
                                                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                                            >
                                                Новый пароль
                                            </button>
                                        </form>
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
                                                className="rounded border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700 hover:bg-red-100"
                                            >
                                                Удалить
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                            {webmasters.data.length === 0 && (
                                <div className="py-6 text-center text-sm text-gray-500">Нет вебмастеров по фильтрам</div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <div>
                                Показано {webmasters.from}–{webmasters.to} из {webmasters.total}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">На странице:</span>
                                <select
                                    className="rounded border px-2 pr-8 py-1 text-sm"
                                    value={filterForm.data.per_page}
                                    onChange={(e) => filterForm.setData('per_page', e.target.value)}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {webmasters.links?.map((link, idx) => {
                                    let label = link.label;
                                    if (label.includes('Previous')) label = 'Предыдущая';
                                    if (label.includes('Next')) label = 'Следующая';
                                    return (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                            className={`rounded px-3 py-1 text-xs font-semibold ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
