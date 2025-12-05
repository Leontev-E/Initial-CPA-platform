import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GeoMultiSelect from '@/Components/GeoMultiSelect';
import geos from '@/data/geos.json';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function Index({ offers, categories, filters }) {
    const [geoInput, setGeoInput] = useState('');
    const [geoOpen, setGeoOpen] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const geoMap = useMemo(() => Object.fromEntries(geos.map((g) => [g.value, g.text])), []);

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
        image: null,
    });

    const filterForm = useForm({
        search: filters?.search ?? '',
        category_id: filters?.category_id ?? '',
        status: filters?.status ?? '',
        sort: filters?.sort ?? 'name',
        direction: filters?.direction ?? 'asc',
        per_page: filters?.per_page ?? 10,
        geos: filters?.geos ?? [],
    });

    const hasActiveFilters = Boolean(
        filterForm.data.search ||
        filterForm.data.category_id ||
        filterForm.data.status ||
        (filterForm.data.geos || []).length > 0 ||
        filterForm.data.sort !== 'name' ||
        filterForm.data.direction !== 'asc' ||
        filterForm.data.per_page !== 10
    );

    const applyFilters = (nextData = null) => {
        const payload = nextData ?? filterForm.data;
        filterForm.get(route('admin.offers.index'), payload, {
            preserveState: false,
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
                        Новый оффер
                    </h3>
                    <form onSubmit={submit} className="mt-3 space-y-3" encType="multipart/form-data">
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
                            placeholder="Название"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Ставка (default)"
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
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Описание"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <textarea
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Примечание для партнерской программы"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Ссылка на материалы (Google/Яндекс диск)"
                            value={data.materials_link}
                            onChange={(e) => setData('materials_link', e.target.value)}
                        />
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">График звонков</div>
                                    <div className="text-xs text-gray-500">Укажите время работы колл-центра</div>
                                </div>
                                <select
                                    className="h-10 rounded-lg border px-3 py-2 text-sm"
                                    value={data.call_center_timezone}
                                    onChange={(e) => setData('call_center_timezone', e.target.value)}
                                >
                                    <option value="local">По местному времени</option>
                                    <option value="msk">По МСК</option>
                                </select>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <label className="flex flex-col">
                                    <span className="text-[11px] uppercase text-gray-500">Начало</span>
                                    <input
                                        type="time"
                                        className="h-10 rounded-lg border px-3 py-2"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </label>
                                <label className="flex flex-col">
                                    <span className="text-[11px] uppercase text-gray-500">Окончание</span>
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
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Создать
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-700">Список офферов</h3>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                <input
                                    className="rounded border px-3 py-2 text-sm"
                                    placeholder="Поиск по названию"
                                    value={filterForm.data.search}
                                    onChange={(e) => {
                                        filterForm.setData('search', e.target.value);
                                    }}
                                    onBlur={() => applyFilters()}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                                <select
                                    className="rounded border px-3 py-2 text-sm"
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
                                <GeoMultiSelect
                                    value={filterForm.data.geos}
                                    onChange={(vals) => {
                                        filterForm.setData('geos', vals);
                                        applyFilters();
                                    }}
                                    placeholder="GEO"
                                    emptyLabel="Все GEO"
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
                                    <option value="default_payout">По ставке</option>
                                    <option value="created_at">По дате добавления</option>
                                    <option value="category">По категории</option>
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
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const cleared = {
                                                search: '',
                                                category_id: '',
                                                status: '',
                                                sort: 'name',
                                                direction: 'asc',
                                                per_page: 10,
                                                geos: [],
                                            };
                                            filterForm.setData(cleared);
                                            applyFilters(cleared);
                                        }}
                                        className="rounded border px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                        Сбросить
                                    </button>
                                )}
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
                                    onChange={(e) => {
                                        const next = { ...filterForm.data, per_page: e.target.value };
                                        filterForm.setData('per_page', e.target.value);
                                        applyFilters(next);
                                    }}
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
