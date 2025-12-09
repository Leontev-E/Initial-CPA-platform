import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import geos from '@/data/geos.json';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function Index({ offers, categories, filters, offerLimit, webmasters = [] }) {
    const [geoInput, setGeoInput] = useState('');
    const [geoOpen, setGeoOpen] = useState(false);
    const [filterGeoInput, setFilterGeoInput] = useState('');
    const [filterGeoOpen, setFilterGeoOpen] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const geoMap = useMemo(() => Object.fromEntries(geos.map((g) => [g.value, g.text])), []);
    const limitInfo = offerLimit ?? usePage().props.offerLimit;
    const limitReached = limitInfo?.reached;
    const noCategories = categories.length === 0;

    const { data, setData, post, processing, reset, errors } = useForm({
        offer_category_id: categories[0]?.id ?? '',
        category_ids: categories[0]?.id ? [categories[0].id] : [],
        name: '',
        default_payout: '',
        allowed_geos: [],
        description: '',
        notes: '',
        materials_link: '',
        call_center_hours: '',
        call_center_timezone: 'local',
        is_active: true,
        is_private: false,
        allowed_webmasters: [],
        image: null,
    });
    const formDisabled = noCategories;
    const addAllowedWebmaster = () => {
        const firstId = webmasters[0]?.id ?? '';
        setData('allowed_webmasters', [...(data.allowed_webmasters || []), { webmaster_id: firstId, custom_payout: '' }]);
    };
    const updateAllowedWebmaster = (idx, field, value) => {
        setData(
            'allowed_webmasters',
            (data.allowed_webmasters || []).map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
        );
    };
    const removeAllowedWebmaster = (idx) => {
        setData(
            'allowed_webmasters',
            (data.allowed_webmasters || []).filter((_, i) => i !== idx),
        );
    };

    const filterForm = useForm({
        search: filters?.search ?? '',
        category_id: filters?.category_id ?? '',
        status: filters?.status ?? '',
        sort: filters?.sort ?? 'name',
        direction: filters?.direction ?? 'asc',
        per_page: filters?.per_page ?? 10,
        geos: filters?.geos ?? [],
    });

    const applyFilters = () => {
        filterForm.get(route('admin.offers.index'), {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterForm.data.sort, filterForm.data.direction, filterForm.data.per_page]);

    const submit = (e) => {
        e.preventDefault();
        const payload = { ...data, offer_category_id: data.category_ids[0] ?? data.offer_category_id ?? null };
        post(route('admin.offers.store'), payload, {
            forceFormData: true,
            onSuccess: () => {
                reset(
                    'category_ids',
                    'name',
                    'default_payout',
                    'allowed_geos',
                    'description',
                    'notes',
                    'materials_link',
                    'call_center_hours',
                    'call_center_timezone',
                    'image',
                    'offer_category_id',
                    'is_active',
                );
                setData('category_ids', categories[0]?.id ? [categories[0].id] : []);
                setData('offer_category_id', categories[0]?.id ?? '');
                setData('is_active', true);
                setData('allowed_geos', []);
                setGeoInput('');
                setData('call_center_timezone', 'local');
                setStartTime('');
                setEndTime('');
                setFileInputKey(Date.now());
            },
        });
    };

    const addGeo = (value) => {
        const code = value.trim().toUpperCase();
        if (!code) return;
        const exists = geos.some((g) => g.value === code);
        if (!exists) return;
        if (!data.allowed_geos.includes(code)) {
            setData('allowed_geos', [...data.allowed_geos, code]);
        }
        setGeoInput('');
    };

    const addFilterGeo = (value) => {
        const code = value.trim().toUpperCase();
        if (!code) return;
        const exists = geos.some((g) => g.value === code);
        if (!exists) return;
        if (!filterForm.data.geos.includes(code)) {
            filterForm.setData('geos', [...filterForm.data.geos, code]);
        }
        setFilterGeoInput('');
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

    const filterGeoMatches = useMemo(() => {
        const term = filterGeoInput.trim().toLowerCase();
        if (!term) return geos.slice(0, 8);
        return geos
            .filter(
                (g) =>
                    g.value.toLowerCase().includes(term) ||
                    g.text.toLowerCase().includes(term),
            )
            .slice(0, 8);
    }, [filterGeoInput]);

    useEffect(() => {
        if (startTime && endTime) {
            setData('call_center_hours', `${startTime}-${endTime}`);
        } else {
            setData('call_center_hours', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTime, endTime]);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Офферы</h2>}
        >
            <Head title="Офферы" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Создать оффер
                    </h3>
                    {limitReached && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            Вы достигли лимита по количеству офферов. Свяжитесь с поддержкой, чтобы увеличить лимит.
                        </div>
                    )}
                    {noCategories && (
                        <div className="mt-2 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            <div>Чтобы создать оффер, сначала добавьте категорию.</div>
                            <Link
                                href={route('admin.offer-categories.index')}
                                className="inline-flex items-center gap-2 rounded border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            >
                                Перейти к категориям
                            </Link>
                        </div>
                    )}
                    <form onSubmit={submit} className="mt-3 space-y-3" encType="multipart/form-data">
                        <fieldset disabled={formDisabled} className="space-y-3">
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
                        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                            <div className="text-xs font-semibold text-gray-600">Общее</div>
                            <input
                                className="w-full rounded-lg border px-3 py-2"
                                placeholder="Название оффера"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            <div className="text-xs text-gray-500">Так оффер будет отображаться в кабинетах</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                            <div className="text-xs font-semibold text-gray-600">Выплаты</div>
                            <input
                                className="w-full rounded-lg border px-3 py-2"
                                placeholder="Ставка (default), например 10.00"
                                value={data.default_payout}
                                onChange={(e) =>
                                    setData('default_payout', e.target.value)
                                }
                            />
                            <div className="text-xs text-gray-500">Базовый payout, может переопределяться индивидуальными ставками</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold text-gray-600">Разрешенные GEO</div>
                                <div className="text-[11px] text-gray-500">Начните вводить код GEO</div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                        placeholder="Например, RU, KZ, UZ"
                                        value={geoInput}
                                        onChange={(e) => setGeoInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addGeo(geoInput);
                                            }
                                        }}
                                        onFocus={() => setGeoOpen(true)}
                                        onBlur={() => setTimeout(() => setGeoOpen(false), 120)}
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
                        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                            <div className="text-xs font-semibold text-gray-600">Описание</div>
                            <textarea
                                className="w-full rounded-lg border px-3 py-2"
                                placeholder="Краткое описание оффера, правила, важные детали"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                                <span>Заметки для ПП</span>
                                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">видит вебмастер</span>
                            </div>
                            <textarea
                                className="w-full rounded-lg border px-3 py-2"
                                placeholder="Ключевая инфа, которую увидит вебмастер при просмотре оффера"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            <div className="text-xs text-gray-500">Используйте для акцентов: дедлайны, нюансы трафика, что важно знать вебмастеру.</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                            <div className="text-xs font-semibold text-gray-600">Материалы</div>
                            <input
                                className="w-full rounded-lg border px-3 py-2"
                                placeholder="Ссылка на материалы (Google/Яндекс диск)"
                                value={data.materials_link}
                                onChange={(e) => setData('materials_link', e.target.value)}
                            />
                            <div className="text-xs text-gray-500">Добавьте ссылку на презентации, креативы или инструкции</div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">График работы колл-центра</div>
                                    <div className="text-xs text-gray-500">Укажите время, когда КЦ звонит лидам</div>
                                </div>
                                <select
                                    className="h-10 rounded-lg border px-3 py-2 text-sm"
                                    value={data.call_center_timezone}
                                    onChange={(e) => setData('call_center_timezone', e.target.value)}
                                >
                                    <option value="local">По местному времени лида</option>
                                    <option value="msk">По МСК</option>
                                </select>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="flex flex-col gap-1">
                                    <span className="text-[11px] uppercase text-gray-500">Начало работы</span>
                                    <input
                                        type="time"
                                        className="h-10 rounded-lg border px-3 py-2"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-[11px] uppercase text-gray-500">Окончание работы</span>
                                    <input
                                        type="time"
                                        className="h-10 rounded-lg border px-3 py-2"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-700">
                                Фото оффера (jpg/png)
                            </label>
                            <input
                                key={fileInputKey}
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
                        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_private}
                                    onChange={(e) => setData('is_private', e.target.checked)}
                                />
                                Приватный оффер (видят только выбранные вебмастера)
                            </label>
                            {data.is_private && (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={addAllowedWebmaster}
                                            className="rounded border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                        >
                                            Добавить вебмастера
                                        </button>
                                        {errors['allowed_webmasters'] && (
                                            <div className="text-xs text-red-600">{errors['allowed_webmasters']}</div>
                                        )}
                                    </div>
                                    {(data.allowed_webmasters || []).map((row, idx) => (
                                        <div key={idx} className="grid gap-2 rounded border px-3 py-2 md:grid-cols-3">
                                            <select
                                                className="h-10 rounded border px-2 text-sm"
                                                value={row.webmaster_id}
                                                onChange={(e) => updateAllowedWebmaster(idx, 'webmaster_id', e.target.value)}
                                            >
                                                {webmasters.map((wm) => (
                                                    <option key={wm.id} value={wm.id}>
                                                        {wm.name} ({wm.email})
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                className="h-10 rounded border px-3 text-sm"
                                                placeholder="Инд. ставка (опц.)"
                                                value={row.custom_payout ?? ''}
                                                onChange={(e) => updateAllowedWebmaster(idx, 'custom_payout', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAllowedWebmaster(idx)}
                                                className="h-10 rounded border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    ))}
                                    {(data.allowed_webmasters || []).length === 0 && (
                                        <div className="text-xs text-gray-500">Не выбрано ни одного вебмастера</div>
                                    )}
                                </div>
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
                            disabled={processing || limitReached}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Создать
                        </button>
                        </fieldset>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-700">Список офферов</h3>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                <input
                                    className="h-10 rounded border px-3 py-2 text-sm"
                                    placeholder="Поиск по названию"
                                    value={filterForm.data.search}
                                    onChange={(e) => filterForm.setData('search', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                                <select
                                    className="h-10 rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.category_id}
                                    onChange={(e) => {
                                        filterForm.setData('category_id', e.target.value);
                                        applyFilters();
                                    }}
                                >
                                    <option value="">Все категории</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="flex flex-col gap-1">
                                    <div className="relative">
                                        <input
                                            className="h-10 w-full rounded border px-3 py-2 text-sm"
                                            placeholder="Добавить GEO в фильтр"
                                            value={filterGeoInput}
                                            onChange={(e) => setFilterGeoInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addFilterGeo(filterGeoInput);
                                                }
                                            }}
                                            onFocus={() => setFilterGeoOpen(true)}
                                            onBlur={() => setTimeout(() => setFilterGeoOpen(false), 120)}
                                        />
                                        {filterGeoOpen && filterGeoMatches.length > 0 && (
                                            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                                                {filterGeoMatches.map((geo) => (
                                                    <button
                                                        type="button"
                                                        key={geo.value}
                                                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                                                        onClick={() => {
                                                            addFilterGeo(geo.value);
                                                            setFilterGeoOpen(true);
                                                        }}
                                                    >
                                                        <span>{geo.value} — {geo.text}</span>
                                                        {filterForm.data.geos.includes(geo.value) && (
                                                            <span className="text-[11px] text-indigo-600">добавлен</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {filterForm.data.geos.map((code) => (
                                            <span key={code} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] text-indigo-700">
                                                {code}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        filterForm.setData(
                                                            'geos',
                                                            filterForm.data.geos.filter((g) => g !== code),
                                                        )
                                                    }
                                                    className="text-indigo-500 hover:text-indigo-700"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                        {filterForm.data.geos.length === 0 && (
                                            <span className="text-xs text-gray-500">Все GEO</span>
                                        )}
                                    </div>
                                </div>
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
                                    onChange={(e) => filterForm.setData('sort', e.target.value)}
                                >
                                    <option value="name">По алфавиту</option>
                                    <option value="default_payout">По ставке</option>
                                    <option value="created_at">По дате добавления</option>
                                    <option value="category">По категории</option>
                                </select>
                                <select
                                    className="rounded border px-3 py-2 text-sm"
                                    value={filterForm.data.direction}
                                    onChange={(e) => filterForm.setData('direction', e.target.value)}
                                >
                                    <option value="asc">По возрастанию</option>
                                    <option value="desc">По убыванию</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                    Применить
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 divide-y">
                            {offers.data.map((offer) => (
                                <div
                                    key={offer.id}
                                    className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
                                >
                                    <Link
                                        href={route('admin.offers.show', offer.id)}
                                        className="flex flex-1 items-center gap-3"
                                    >
                                        {offer.image_url && (
                                            <img
                                                src={offer.image_url}
                                                alt={offer.name}
                                                className="h-12 w-12 rounded object-contain bg-slate-50"
                                            />
                                        )}
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {offer.name}{' '}
                                                {!offer.is_active && (
                                                    <span className="rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                                                        выключен
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ID: {offer.id} • {(offer.categories || [offer.category]).filter(Boolean).map((c) => c.name).join(', ') || 'Без категории'}
                                                {' '}• GEO:{' '}
                                                {(offer.allowed_geos || []).join(', ')}
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="flex flex-col items-end gap-1 text-right text-sm">
                                        <div className="font-semibold text-gray-900">{offer.default_payout} $</div>
                                        <div className="text-xs text-gray-500">Добавлен: {offer.created_at_human}</div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={route('admin.offers.show', offer.id)}
                                                className="rounded border border-indigo-200 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                                            >
                                                Редактировать
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => router.patch(route('admin.offers.toggle', offer.id), {}, { preserveScroll: true })}
                                                className="rounded border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                                            >
                                                {offer.is_active ? 'Отключить' : 'Включить'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Удалить оффер?')) {
                                                        router.delete(route('admin.offers.destroy', offer.id), { preserveScroll: true });
                                                    }
                                                }}
                                                className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {offers.data.length === 0 && (
                                <div className="py-6 text-center text-sm text-gray-500">Нет офферов по фильтрам</div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <div>
                                Показано {offers.from}–{offers.to} из {offers.total}
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
                                {offers.links?.map((link, idx) => {
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
