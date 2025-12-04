import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Index({ categories, filters }) {
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });
    const filterForm = useForm({
        search: filters?.search ?? '',
        sort: filters?.sort ?? 'name',
        direction: filters?.direction ?? 'asc',
        per_page: filters?.per_page ?? 10,
        status: filters?.status ?? '',
    });

    const applyFilters = () => {
        filterForm.get(route('admin.offer-categories.index'), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterForm.data.sort, filterForm.data.direction, filterForm.data.per_page]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.offer-categories.store'), {
            onSuccess: () => reset('name', 'slug', 'description'),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Категории офферов</h2>}
        >
            <Head title="Категории" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Новая категория
                    </h3>
                    <form onSubmit={submit} className="mt-3 space-y-3">
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Название"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="ID (опционально, генерируется автоматически)"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Описание"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                            />
                            Активна
                        </label>
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
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Список категорий</h3>
                                <p className="text-xs text-gray-500">Поиск, сортировка, пагинация</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm">
                                <input
                                    className="w-44 rounded border px-3 py-2"
                                    placeholder="Поиск по названию"
                                    value={filterForm.data.search}
                                    onChange={(e) => filterForm.setData('search', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                                <select
                                    className="rounded border px-3 py-2"
                                    value={filterForm.data.status}
                                    onChange={(e) => filterForm.setData('status', e.target.value)}
                                >
                                    <option value="">Все статусы</option>
                                    <option value="active">Активные</option>
                                    <option value="inactive">Выключенные</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2"
                                    value={filterForm.data.sort}
                                    onChange={(e) => filterForm.setData('sort', e.target.value)}
                                >
                                    <option value="name">По алфавиту</option>
                                    <option value="created_at">По дате создания</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2"
                                    value={filterForm.data.direction}
                                    onChange={(e) => filterForm.setData('direction', e.target.value)}
                                >
                                    <option value="asc">По возрастанию</option>
                                    <option value="desc">По убыванию</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2"
                                    value={filterForm.data.per_page}
                                    onChange={(e) => filterForm.setData('per_page', e.target.value)}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className="rounded bg-slate-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-slate-200"
                                >
                                    Применить
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 divide-y">
                            {categories.data.map((cat) => (
                                <CategoryRow key={cat.id} cat={cat} />
                            ))}
                            {categories.data.length === 0 && (
                                <div className="py-6 text-center text-sm text-gray-500">Нет категорий по фильтрам</div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                            <div>
                                Показано {categories.from}–{categories.to} из {categories.total}
                            </div>
                            <div className="flex gap-1">
                                {categories.links?.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                        className={`rounded px-3 py-1 text-xs font-semibold ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function CategoryRow({ cat }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, patch, processing } = useForm({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        is_active: !!cat.is_active,
    });

    const submitUpdate = (e) => {
        e.preventDefault();
        patch(route('admin.offer-categories.update', cat.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    return (
        <div className="py-3">
            {!editing ? (
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            {cat.name}{' '}
                            {!cat.is_active && (
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                    выключена
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">{cat.slug}</div>
                        <div className="text-xs text-gray-500">
                            {cat.description || '—'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="rounded bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                        >
                            Редактировать
                        </button>
                        <form
                            method="post"
                            action={route('admin.offer-categories.toggle', cat.id)}
                        >
                            <input type="hidden" name="_method" value="patch" />
                            <button
                                type="submit"
                                className="rounded bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                            >
                                {cat.is_active ? 'Отключить' : 'Включить'}
                            </button>
                        </form>
                        <form
                            method="post"
                            action={route('admin.offer-categories.destroy', cat.id)}
                            onSubmit={(e) => {
                                if (!confirm('Удалить категорию?')) e.preventDefault();
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
                </div>
            ) : (
                <form onSubmit={submitUpdate} className="rounded-lg bg-slate-50 p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Название"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="ID (опционально, генерируется автоматически)"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                    </div>
                    <textarea
                        className="mt-3 w-full rounded-lg border px-3 py-2"
                        placeholder="Описание"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                    <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                        />
                        Активна
                    </label>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Сохранить
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(false);
                                setData({
                                    name: cat.name || '',
                                    slug: cat.slug || '',
                                    description: cat.description || '',
                                    is_active: !!cat.is_active,
                                });
                            }}
                            className="rounded border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
