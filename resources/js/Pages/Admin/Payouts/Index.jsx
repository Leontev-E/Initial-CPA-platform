import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect } from 'react';

const statuses = [
    { value: 'pending', label: 'В ожидании' },
    { value: 'in_process', label: 'В процессе' },
    { value: 'paid', label: 'Оплачено' },
    { value: 'cancelled', label: 'Отменена' },
];

export default function Index({ payouts, balances, webmasters, filters }) {
    const createForm = useForm({
        webmaster_id: balances[0]?.id ?? '',
        amount: '',
        method: 'USDT TRC20',
        details: '',
    });

    const filterForm = useForm({
        search: filters?.search ?? '',
        status: filters?.status ?? '',
        webmaster_id: filters?.webmaster_id ?? '',
        date_from: filters?.date_from ?? '',
        date_to: filters?.date_to ?? '',
        sort: filters?.sort ?? 'created_at',
        direction: filters?.direction ?? 'desc',
        per_page: filters?.per_page ?? 10,
    });

    const applyFilters = () => {
        filterForm.get(route('admin.payouts.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterForm.data.sort, filterForm.data.direction, filterForm.data.per_page]);

    const submit = (e) => {
        e.preventDefault();
        createForm.post(route('admin.payouts.store'), {
            onSuccess: () => createForm.reset('amount', 'details'),
        });
    };

    const exportUrl = route('admin.payouts.index', { ...filterForm.data, export: 1 });

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
                            value={createForm.data.webmaster_id}
                            onChange={(e) =>
                                createForm.setData('webmaster_id', e.target.value)
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
                            value={createForm.data.amount}
                            onChange={(e) => createForm.setData('amount', e.target.value)}
                        />
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Метод"
                            value={createForm.data.method}
                            onChange={(e) => createForm.setData('method', e.target.value)}
                        />
                        <textarea
                            className="w-full rounded border px-3 py-2"
                            placeholder="Детали"
                            value={createForm.data.details}
                            onChange={(e) =>
                                createForm.setData('details', e.target.value)
                            }
                        />
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Создать
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-3">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-700">Фильтры</h3>
                            <a
                                href={exportUrl}
                                className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                                Выгрузить CSV
                            </a>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            <input
                                className="rounded border px-3 py-2 text-sm"
                                placeholder="Поиск (метод, детали, вебмастер)"
                                value={filterForm.data.search}
                                onChange={(e) => filterForm.setData('search', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            />
                            <select
                                className="rounded border px-3 py-2 text-sm"
                                value={filterForm.data.webmaster_id}
                                onChange={(e) => {
                                    filterForm.setData('webmaster_id', e.target.value);
                                    applyFilters();
                                }}
                            >
                                <option value="">Все вебмастера</option>
                                {webmasters.map((wm) => (
                                    <option key={wm.id} value={wm.id}>
                                        {wm.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="rounded border px-3 py-2 text-sm"
                                value={filterForm.data.status}
                                onChange={(e) => {
                                    filterForm.setData('status', e.target.value);
                                    applyFilters();
                                }}
                            >
                                <option value="">Все статусы</option>
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                className="rounded border px-3 py-2 text-sm"
                                value={filterForm.data.date_from}
                                onChange={(e) => filterForm.setData('date_from', e.target.value)}
                            />
                            <input
                                type="date"
                                className="rounded border px-3 py-2 text-sm"
                                value={filterForm.data.date_to}
                                onChange={(e) => filterForm.setData('date_to', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.sort}
                                    onChange={(e) => filterForm.setData('sort', e.target.value)}
                                >
                                    <option value="created_at">По дате</option>
                                    <option value="amount">По сумме</option>
                                    <option value="status">По статусу</option>
                                    <option value="webmaster">По вебмастеру</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.direction}
                                    onChange={(e) => filterForm.setData('direction', e.target.value)}
                                >
                                    <option value="desc">По убыванию</option>
                                    <option value="asc">По возрастанию</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={applyFilters}
                                className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                                Применить
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    filterForm.reset();
                                    applyFilters();
                                }}
                                className="rounded border px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Сбросить
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Заявки
                            </h3>
                        </div>
                        <div className="mt-3 divide-y">
                            {payouts.data.map((payout) => (
                                <PayoutRow payout={payout} key={payout.id} />
                            ))}
                            {payouts.data.length === 0 && (
                                <div className="py-6 text-center text-sm text-gray-500">
                                    Нет заявок по фильтрам
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <div>
                                Показано {payouts.from}–{payouts.to} из {payouts.total}
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
                                {payouts.links?.map((link, idx) => {
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

function PayoutRow({ payout }) {
    const { data, setData, patch, processing } = useForm({
        status: payout.status,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.payouts.update', payout.id));
    };

    const statusLabel = statuses.find((s) => s.value === payout.status)?.label ?? payout.status;

    return (
        <div className="flex flex-col gap-2 py-3 text-sm text-gray-700 md:flex-row md:items-center md:justify-between">
            <div>
                <div className="font-semibold text-gray-900">
                    {payout.webmaster?.name ?? '—'}
                </div>
                <div className="text-xs text-gray-500">
                    {payout.amount} $ • {payout.method}
                </div>
                <div className="text-xs text-gray-500">
                    Создано: {payout.created_at_human ?? '—'} {payout.processed_at_human && `• Обработано: ${payout.processed_at_human}`}
                </div>
                <div className="text-xs text-gray-500">Статус: {statusLabel}</div>
            </div>
            <form onSubmit={submit} className="flex items-center gap-2">
                <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                >
                    {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
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
