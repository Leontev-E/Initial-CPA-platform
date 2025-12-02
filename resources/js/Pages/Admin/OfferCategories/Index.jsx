import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Index({ categories, filters }) {
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });

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
                        <h3 className="text-sm font-semibold text-gray-700">
                            Список
                        </h3>
                        <div className="mt-3 divide-y">
                            {categories.data.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {cat.name}{' '}
                                            {!cat.is_active && (
                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                                    выключена
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {cat.slug}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {cat.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
