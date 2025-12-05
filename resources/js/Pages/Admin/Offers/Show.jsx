import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import geos from '@/data/geos.json';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function Show({ offer, categories }) {
    const [geoInput, setGeoInput] = useState('');
    const [geoOpen, setGeoOpen] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const geoMap = useMemo(() => Object.fromEntries(geos.map((g) => [g.value, g.text])), []);
    const { data, setData, post, processing, errors } = useForm({
        offer_category_id: offer.offer_category_id,
        category_ids: (offer.categories || []).map((c) => c.id),
        name: offer.name,
        default_payout: offer.default_payout,
        allowed_geos: offer.allowed_geos || [],
        description: offer.description || '',
        notes: offer.notes || '',
        materials_link: offer.materials_link || '',
        call_center_hours: offer.call_center_hours || '',
        call_center_timezone: offer.call_center_timezone || 'local',
        is_active: offer.is_active,
        image: null,
        _method: 'patch',
    });
    const deleteForm = useForm({});
    const landingFileForm = useForm({
        type: 'local',
        name: '',
        landing_file: null,
    });
    const landingLinkForm = useForm({
        type: 'link',
        name: '',
        url: '',
    });

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

    useEffect(() => {
        const hours = offer.call_center_hours || '';
        const [start, end] = hours.split('-');
        if (start) setStartTime(start);
        if (end) setEndTime(end);
    }, [offer.call_center_hours]);

    useEffect(() => {
        if (startTime && endTime) {
            setData('call_center_hours', `${startTime}-${endTime}`);
        } else {
            setData('call_center_hours', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTime, endTime]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.offers.update', offer.id), {
            forceFormData: true,
        });
    };

    const submitLandingFile = (e) => {
        e.preventDefault();
        landingFileForm.post(route('admin.offers.landings.add', offer.id), {
            forceFormData: true,
            onSuccess: () => landingFileForm.reset('name', 'landing_file'),
        });
    };

    const submitLandingLink = (e) => {
        e.preventDefault();
        landingLinkForm.post(route('admin.offers.landings.add', offer.id), {
            onSuccess: () => landingLinkForm.reset('name', 'url'),
        });
    };

    const localCount = offer.landings?.filter((l) => l.type === 'local').length || 0;
    const linkCount = offer.landings?.filter((l) => l.type === 'link').length || 0;

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">{offer.name}</h2>}
        >
            <Head title={offer.name} />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-2">
                    <div className="mb-2 text-xs text-gray-500">ID оффера: {offer.id}</div>
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
                                        onFocus={() => setGeoOpen(true)}
                                        onBlur={() => setTimeout(() => setGeoOpen(false), 120)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addGeo(geoInput);
                                            }
                                        }}
                                    />
                                    {geoOpen && geoMatches.length > 0 && (
                                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                                            {geoMatches.map((geo) => (
                                                <button
                                                    type="button"
                                                    key={geo.value}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                                                    onClick={() => {
                                                        addGeo(geo.value);
                                                        setGeoOpen(true);
                                                    }}
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
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={data.materials_link}
                            onChange={(e) => setData('materials_link', e.target.value)}
                            placeholder="Ссылка на материалы (Google/Яндекс диск)"
                        />
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="flex gap-2">
                                <div className="w-full">
                                    <div className="text-xs text-gray-600">Начало</div>
                                    <input
                                        type="time"
                                        className="w-full rounded-lg border px-3 py-2"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div className="w-full">
                                    <div className="text-xs text-gray-600">Окончание</div>
                                    <input
                                        type="time"
                                        className="w-full rounded-lg border px-3 py-2"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <select
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                value={data.call_center_timezone}
                                onChange={(e) => setData('call_center_timezone', e.target.value)}
                            >
                                <option value="local">По местному времени</option>
                                <option value="msk">По МСК</option>
                            </select>
                        </div>
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
                                <div className="space-y-0.5">
                                    <Link
                                        href={route('admin.webmasters.show', rate.webmaster?.id)}
                                        className="font-semibold text-indigo-700 hover:underline"
                                    >
                                        {rate.webmaster?.name}
                                    </Link>
                                    <div className="text-xs text-gray-500">
                                        {rate.webmaster?.email}
                                    </div>
                                </div>
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
                <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-1">
                    <h3 className="text-sm font-semibold text-gray-700">Лендинги</h3>
                    <div className="mt-3 space-y-3 text-sm">
                        <div className="space-y-2 rounded border px-3 py-2">
                            <div className="text-xs font-semibold text-gray-600">Локальный лендинг (zip, до 70 МБ)</div>
                            <form onSubmit={submitLandingFile} className="space-y-2" encType="multipart/form-data">
                                <input
                                    className="w-full rounded border px-3 py-2 text-sm"
                                    placeholder="Название лендинга"
                                    value={landingFileForm.data.name}
                                    onChange={(e) => landingFileForm.setData('name', e.target.value)}
                                    disabled={localCount >= 2}
                                />
                                <input
                                    type="file"
                                    accept=".zip"
                                    className="w-full rounded border px-3 py-2 text-sm"
                                    onChange={(e) => landingFileForm.setData('landing_file', e.target.files?.[0] ?? null)}
                                    disabled={localCount >= 2}
                                />
                                {landingFileForm.errors.landing_file && (
                                    <div className="text-xs text-red-600">{landingFileForm.errors.landing_file}</div>
                                )}
                                <button
                                    type="submit"
                                    disabled={landingFileForm.processing || localCount >= 2}
                                    className="w-full rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Загрузить ({localCount}/2)
                                </button>
                            </form>
                        </div>
                        <div className="space-y-2 rounded border px-3 py-2">
                            <div className="text-xs font-semibold text-gray-600">Лендинг по ссылке</div>
                            <form onSubmit={submitLandingLink} className="space-y-2">
                                <input
                                    className="w-full rounded border px-3 py-2 text-sm"
                                    placeholder="Название лендинга"
                                    value={landingLinkForm.data.name}
                                    onChange={(e) => landingLinkForm.setData('name', e.target.value)}
                                    disabled={linkCount >= 10}
                                />
                                <input
                                    className="w-full rounded border px-3 py-2 text-sm"
                                    placeholder="https://..."
                                    value={landingLinkForm.data.url}
                                    onChange={(e) => landingLinkForm.setData('url', e.target.value)}
                                    disabled={linkCount >= 10}
                                />
                                {landingLinkForm.errors.url && (
                                    <div className="text-xs text-red-600">{landingLinkForm.errors.url}</div>
                                )}
                                <button
                                    type="submit"
                                    disabled={landingLinkForm.processing || linkCount >= 10}
                                    className="w-full rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Добавить ссылку ({linkCount}/10)
                                </button>
                            </form>
                        </div>
                        <div className="divide-y rounded border">
                            {offer.landings?.map((landing) => (
                                <div key={landing.id} className="flex flex-col gap-1 px-3 py-2 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-semibold text-gray-900">{landing.name}</div>
                                        <span className={`rounded px-2 py-1 text-[11px] font-semibold ${landing.type === 'local' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {landing.type === 'local' ? 'Локальный' : 'Ссылка'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                        {landing.type === 'local' && landing.size && <span>{(landing.size / 1024 / 1024).toFixed(1)} МБ</span>}
                                        {landing.preview_url && (
                                            <a href={route('landings.preview', landing.id)} target="_blank" className="rounded border border-indigo-200 px-2 py-1 font-semibold text-indigo-700 hover:bg-indigo-50">
                                                Открыть
                                            </a>
                                        )}
                                        {landing.download_url && (
                                            <a href={route('landings.download', landing.id)} className="rounded border border-gray-200 px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50">
                                                Скачать
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Удалить лендинг?')) {
                                                    router.delete(route('admin.offers.landings.remove', { offer: offer.id, landing: landing.id }));
                                                }
                                            }}
                                            className="rounded border border-red-200 px-2 py-1 font-semibold text-red-700 hover:bg-red-50"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(offer.landings?.length ?? 0) === 0 && (
                                <div className="px-3 py-4 text-center text-xs text-gray-500">
                                    Лендинги не добавлены
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
