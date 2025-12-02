import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Show({ offer }) {
    const { data, setData, patch, processing } = useForm({
        offer_category_id: offer.offer_category_id,
        name: offer.name,
        slug: offer.slug,
        default_payout: offer.default_payout,
        allowed_geos: (offer.allowed_geos || []).join(','),
        description: offer.description || '',
        notes: offer.notes || '',
        is_active: offer.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.offers.update', offer.id));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">{offer.name}</h2>}
        >
            <Head title={offer.name} />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Редактирование
                    </h3>
                    <form onSubmit={submit} className="mt-3 grid gap-3">
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.default_payout}
                            onChange={(e) =>
                                setData('default_payout', e.target.value)
                            }
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.allowed_geos}
                            onChange={(e) =>
                                setData('allowed_geos', e.target.value)
                            }
                        />
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Заметки для админа"
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
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Сохранить
                        </button>
                    </form>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Индивидуальные ставки
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        {offer.rates?.map((rate) => (
                            <div
                                key={rate.id}
                                className="flex items-center justify-between rounded border px-3 py-2"
                            >
                                <div>{rate.webmaster?.name}</div>
                                <div className="font-semibold">
                                    {rate.custom_payout} $
                                </div>
                            </div>
                        ))}
                        {offer.rates?.length === 0 && (
                            <div className="text-gray-500">Нет ставок</div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
