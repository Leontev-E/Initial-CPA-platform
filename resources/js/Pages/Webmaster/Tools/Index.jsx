import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Index({ apiKey, postbacks }) {
    const { post } = useForm({});
    const { errors } = usePage().props;
    const pbForm = useForm({
        postbacks:
            postbacks?.map((pb) => ({
                event: pb.event,
                url: pb.url,
                is_active: pb.is_active,
            })) ?? [
                { event: 'lead', url: '', is_active: true },
                { event: 'sale', url: '', is_active: true },
                { event: 'trash', url: '', is_active: true },
            ],
    });

    const regenerate = () => {
        post(route('webmaster.tools.regenerate'));
    };

    const savePostbacks = (e) => {
        e.preventDefault();
        pbForm.post(route('webmaster.tools.postbacks'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Инструменты</h2>}
        >
            <Head title="Инструменты" />
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        API ключ
                    </h3>
                    <div className="mt-3 flex items-center justify-between rounded border px-3 py-2 text-sm text-gray-700">
                        <span className="font-mono">{apiKey.key}</span>
                        <button
                            onClick={regenerate}
                            className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
                        >
                            Перегенерировать
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Используйте заголовок X-API-KEY в запросах.
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Постбеки
                    </h3>
                    <form onSubmit={savePostbacks} className="mt-3 space-y-3">
                        {pbForm.data.postbacks.map((pb, idx) => (
                            <div
                                key={pb.event}
                                className="rounded border px-3 py-2 text-sm text-gray-700"
                            >
                                <div className="font-semibold uppercase text-gray-600">
                                    {pb.event}
                                </div>
                                <input
                                    className="mt-2 w-full rounded border px-2 py-1"
                                    value={pb.url}
                                    onChange={(e) =>
                                        pbForm.setData('postbacks', [
                                            ...pbForm.data.postbacks.slice(
                                                0,
                                                idx,
                                            ),
                                            {
                                                ...pb,
                                                url: e.target.value,
                                            },
                                            ...pbForm.data.postbacks.slice(
                                                idx + 1,
                                            ),
                                        ])
                                    }
                                    placeholder="https://example.com/postback"
                                />
                                <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={pb.is_active}
                                        onChange={(e) =>
                                            pbForm.setData('postbacks', [
                                                ...pbForm.data.postbacks.slice(
                                                    0,
                                                    idx,
                                                ),
                                                {
                                                    ...pb,
                                                    is_active: e.target.checked,
                                                },
                                                ...pbForm.data.postbacks.slice(
                                                    idx + 1,
                                                ),
                                            ])
                                        }
                                    />
                                    Активен
                                </label>
                            </div>
                        ))}
                        <button
                            type="submit"
                            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Сохранить
                        </button>
                    </form>
                    {errors.postbacks && (
                        <div className="mt-2 text-xs text-red-600">
                            {errors.postbacks}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700">
                    Краткое API описание
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                    Отправляйте лиды POST запросом на{' '}
                    <code>https://openai-book.store/api/leads</code> с JSON телом.
                    Добавьте заголовок <code>X-API-KEY</code> со значением вашего ключа.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
