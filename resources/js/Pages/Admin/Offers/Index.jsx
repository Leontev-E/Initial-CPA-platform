import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Index({ offers, categories, filters }) {
    const { data, setData, post, processing, reset } = useForm({
        offer_category_id: categories[0]?.id ?? '',
        name: '',
        slug: '',
        default_payout: '',
        allowed_geos: '',
        description: '',
        notes: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.offers.store'), {
            onSuccess: () =>
                reset(
                    'name',
                    'slug',
                    'default_payout',
                    'allowed_geos',
                    'description',
                    'notes',
                ),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Офферы</h2>}
        >
            <Head title="Офферы" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Новый оффер
                    </h3>
                    <form onSubmit={submit} className="mt-3 space-y-3">
                        <select
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.offer_category_id}
                            onChange={(e) =>
                                setData('offer_category_id', e.target.value)
                            }
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Название"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Ставка (default)"
                            value={data.default_payout}
                            onChange={(e) =>
                                setData('default_payout', e.target.value)
                            }
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Разрешенные GEO (через запятую)"
                            value={data.allowed_geos}
                            onChange={(e) =>
                                setData('allowed_geos', e.target.value)
                            }
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
                            Активен
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
                            Список офферов
                        </h3>
                        <div className="mt-3 divide-y">
                            {offers.data.map((offer) => (
                                <Link
                                    key={offer.id}
                                    href={route('admin.offers.show', offer.id)}
                                    className="flex items-center justify-between py-3 transition hover:bg-slate-50"
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {offer.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {offer.category?.name} • GEO:{' '}
                                            {(offer.allowed_geos || []).join(
                                                ', ',
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {offer.default_payout} $
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
