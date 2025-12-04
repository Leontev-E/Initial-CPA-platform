import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import geos from '@/data/geos.json';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Show({ offer, categories }) {
    const [geoInput, setGeoInput] = useState('');
    const geoMap = useMemo(() => Object.fromEntries(geos.map((g) => [g.value, g.text])), []);
    const { data, setData, post, processing, errors } = useForm({
        offer_category_id: offer.offer_category_id,
        category_ids: (offer.categories || []).map((c) => c.id),
        name: offer.name,
        default_payout: offer.default_payout,
        allowed_geos: offer.allowed_geos || [],
        description: offer.description || '',
        notes: offer.notes || '',
        is_active: offer.is_active,
        image: null,
        _method: 'patch',
    });
    const deleteForm = useForm({});

    const addGeo = (value) => {
        const code = value.trim().toUpperCase();
        if (!code) return;
        if (!geos.some((g) => g.value === code)) return;
        if (!data.allowed_geos.includes(code)) {
            setData('allowed_geos', [...data.allowed_geos, code]);
        }
        setGeoInput('');
    };

    const geoMatches = useMemo(() => {
        const term = geoInput.trim().toLowerCase();
        if (!term) return geos.slice(0, 8);
        return geos
            .filter(
                (g) =>
                    g.value.toLowerCase().includes(term) ||
                    g.text.toLowerCase().includes(term),
            )
            .slice(0, 8);
    }, [geoInput]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.offers.update', offer.id), {
            forceFormData: true,
        });
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
                    <form onSubmit={submit} className="mt-3 grid gap-3" encType="multipart/form-data">
                        {offer.image_url && (
                            <div>
                                <div className="text-xs text-gray-500">Текущее фото</div>
                                <img
                                    src={offer.image_url}
                                    alt={offer.name}
                                    className="mt-1 h-28 w-full rounded object-contain bg-slate-50"
                                />
                            </div>
                        )}
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <div className="rounded border px-3 py-2">
                            <div className="text-xs font-semibold text-gray-600">Категории</div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                {categories.map((cat) => (
                                    <label key={cat.id} className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={data.category_ids.includes(cat.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setData('category_ids', checked
                                                    ? [...data.category_ids, cat.id]
                                                    : data.category_ids.filter((id) => id !== cat.id));
                                                setData('offer_category_id', checked ? (data.offer_category_id ?? cat.id) : data.category_ids.find((id) => id !== cat.id) ?? null);
                                            }}
                                        />
                                        <span className={!cat.is_active ? 'text-gray-400' : 'text-gray-800'}>
                                            {cat.name} {!cat.is_active && '(выключена)'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.default_payout}
                            onChange={(e) =>
                                setData('default_payout', e.target.value)
                            }
                        />
                        <div>
                            <div className="text-xs font-semibold text-gray-600">Разрешенные GEO</div>
                            <div className="mt-1 flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                        placeholder="Начните вводить GEO"
                                        value={geoInput}
                                        onChange={(e) => setGeoInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addGeo(geoInput);
                                            }
                                        }}
                                    />
                                    {geoMatches.length > 0 && (
                                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                                            {geoMatches.map((geo) => (
                                                <button
                                                    type="button"
                                                    key={geo.value}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                                                    onClick={() => addGeo(geo.value)}
                                                >
                                                    <span>{geo.value} — {geo.text}</span>
                                                    {data.allowed_geos.includes(geo.value) && (
                                                        <span className="text-[11px] text-indigo-600">добавлен</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {data.allowed_geos.map((code) => (
                                        <span key={code} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
                                            {code} — {geoMap[code] || ''}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setData('allowed_geos', data.allowed_geos.filter((g) => g !== code))
                                                }
                                                className="text-indigo-500 hover:text-indigo-700"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {data.allowed_geos.length === 0 && (
                                        <span className="text-xs text-gray-500">ГЕО не выбраны</span>
                                    )}
                                </div>
                            </div>
                        </div>
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
                            placeholder="Заметки для партнерской программы"
                        />
                        <div>
                            <label className="text-sm text-gray-700">
                                Новое фото (опционально)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                onChange={(e) =>
                                    setData('image', e.target.files?.[0] ?? null)
                                }
                            />
                            {errors.image && (
                                <div className="text-xs text-red-600">{errors.image}</div>
                            )}
                        </div>
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
                        {offer.notes && (
                            <div className="rounded border px-3 py-2 text-sm text-gray-700">
                                <div className="text-xs uppercase text-gray-500">Примечание</div>
                                <div>{offer.notes}</div>
                            </div>
                        )}
                        <div className="pt-3">
                            <button
                                onClick={() => {
                                    if (confirm('Удалить оффер? Действие нельзя отменить.')) {
                                        deleteForm.delete(route('admin.offers.destroy', offer.id));
                                    }
                                }}
                                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                disabled={deleteForm.processing}
                            >
                                Удалить оффер
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
