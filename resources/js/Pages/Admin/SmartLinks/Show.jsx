import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

const DEVICES = ['desktop', 'mobile', 'tablet'];
const DEVICE_LABELS = {
    desktop: 'Десктоп',
    mobile: 'Мобильный',
    tablet: 'Планшет',
};

function parseQueryRules(text) {
    if (!text || !text.trim()) return {};
    const source = text.trim();
    try {
        const parsed = JSON.parse(source);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return source.split(/\r?\n/).reduce((acc, line) => {
            const [key, ...rest] = line.split('=');
            const k = (key || '').trim();
            if (!k) return acc;
            const value = rest.join('=').trim();
            acc[k] = value === '' ? '*' : value;
            return acc;
        }, {});
    }
}

function formatQueryRules(queryRules) {
    if (!queryRules || typeof queryRules !== 'object') return '';
    return Object.entries(queryRules).map(([k, v]) => `${k}=${v || '*'}`).join('\n');
}

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}:${ss}`;
}

function createEmptyStream(index = 1) {
    return {
        id: null,
        name: `Поток ${index}`,
        priority: 0,
        weight: 100,
        offer_id: '',
        target_url: '',
        geos_csv: '',
        query_input: '',
        devices: [],
        offer_weights: [],
        is_active: true,
    };
}

function normalizeOfferWeights(weights) {
    if (!Array.isArray(weights)) return [];
    return weights
        .map((row) => ({
            offer_id: row?.offer_id ? String(row.offer_id) : '',
            weight: row?.weight ?? 100,
        }))
        .filter((row) => row.offer_id);
}

function Pagination({ links = [] }) {
    if (!Array.isArray(links) || links.length <= 3) return null;
    return (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {links.map((link, idx) => (
                link.url ? (
                    <Link key={idx} href={link.url} className={`rounded border px-3 py-1 ${link.active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ) : (
                    <span key={idx} className="rounded border border-gray-200 px-3 py-1 text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                )
            ))}
        </div>
    );
}

export default function Show({ smartLink, offers, webmasters = [], clicks, clickFilters = {}, redirectUrl, postback }) {
    const { flash } = usePage().props;

    const form = useForm({
        name: smartLink.name,
        slug: smartLink.slug,
        is_active: Boolean(smartLink.is_active),
        is_public: Boolean(smartLink.is_public),
        fallback_offer_id: smartLink.fallback_offer_id || '',
        fallback_url: smartLink.fallback_url || '',
        webmaster_ids: (smartLink.assignments || []).filter((x) => x.is_active).map((x) => x.webmaster_id),
        streams: (smartLink.streams || []).map((s, idx) => ({
            id: s.id,
            name: s.name || `Поток ${idx + 1}`,
            priority: s.priority ?? 0,
            weight: s.weight ?? 100,
            offer_id: s.offer_id || '',
            target_url: s.target_url || '',
            geos_csv: (s.rules?.geos || []).join(','),
            query_input: formatQueryRules(s.rules?.query || {}),
            devices: s.rules?.devices || [],
            offer_weights: normalizeOfferWeights(s.rules?.offer_weights || []),
            is_active: Boolean(s.is_active),
        })),
    });

    const filters = useForm({
        click_id: clickFilters.click_id ?? '',
        geo: clickFilters.geo ?? '',
        offer_id: clickFilters.offer_id ?? '',
        stream_id: clickFilters.stream_id ?? '',
        webmaster_id: clickFilters.webmaster_id ?? '',
    });

    const toggleWebmaster = (id, checked) => {
        const current = form.data.webmaster_ids || [];
        form.setData('webmaster_ids', checked ? Array.from(new Set([...current, id])) : current.filter((x) => x !== id));
    };

    const updateStream = (idx, patch) => {
        form.setData('streams', form.data.streams.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    };

    const addStream = () => {
        form.setData('streams', [...form.data.streams, createEmptyStream(form.data.streams.length + 1)]);
    };

    const removeStream = (idx) => {
        form.setData('streams', form.data.streams.filter((_, i) => i !== idx));
    };

    const addOfferWeight = (streamIdx) => {
        const current = form.data.streams[streamIdx]?.offer_weights || [];
        updateStream(streamIdx, { offer_weights: [...current, { offer_id: '', weight: 100 }] });
    };

    const updateOfferWeight = (streamIdx, rowIdx, patch) => {
        const current = form.data.streams[streamIdx]?.offer_weights || [];
        updateStream(streamIdx, {
            offer_weights: current.map((row, i) => (i === rowIdx ? { ...row, ...patch } : row)),
        });
    };

    const removeOfferWeight = (streamIdx, rowIdx) => {
        const current = form.data.streams[streamIdx]?.offer_weights || [];
        updateStream(streamIdx, { offer_weights: current.filter((_, i) => i !== rowIdx) });
    };

    const toggleCurrentSmartLink = () => {
        const next = smartLink.is_active ? 'выключить' : 'включить';
        if (!window.confirm(`Точно ${next} SmartLink "${smartLink.name}"?`)) {
            return;
        }

        router.patch(route('admin.smart-links.toggle', smartLink.id), {}, { preserveScroll: true });
    };

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            name: data.name,
            slug: data.slug || null,
            is_active: Boolean(data.is_active),
            is_public: Boolean(data.is_public),
            fallback_offer_id: data.fallback_offer_id || null,
            fallback_url: data.fallback_url || null,
            webmaster_ids: data.webmaster_ids || [],
            streams: data.streams.map((s) => {
                const offerWeights = (s.offer_weights || [])
                    .filter((row) => row.offer_id)
                    .map((row) => ({
                        offer_id: Number(row.offer_id),
                        weight: Number(row.weight || 0),
                    }));

                return {
                    name: s.name || null,
                    offer_id: s.offer_id || null,
                    preset_id: null,
                    weight: Number(s.weight || 0),
                    priority: Number(s.priority || 0),
                    target_url: s.target_url || null,
                    is_active: Boolean(s.is_active),
                    rules: {
                        geos: (s.geos_csv || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean),
                        devices: s.devices || [],
                        query: parseQueryRules(s.query_input),
                        offer_weights: offerWeights,
                    },
                };
            }),
        }));
        form.patch(route('admin.smart-links.update', smartLink.id), { preserveScroll: true });
    };

    const submitFilters = (e) => {
        e.preventDefault();
        filters.get(route('admin.smart-links.show', smartLink.id), { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Смарт-ссылка: {smartLink.name}</h2>}>
            <Head title={`Смарт-ссылка ${smartLink.name}`} />
            <div className="space-y-6">
                {flash?.success ? <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{flash.success}</div> : null}

                <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                    <div className="font-semibold">Маршрутизация и postback</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                        <li>Устройство определяется автоматически по User-Agent посетителя.</li>
                        <li>Таргет — конечный URL, куда отправляется клик после выбора потока/оффера.</li>
                        <li>В редирект добавляется click_id. Его нужно вернуть в postback рекламодателя.</li>
                    </ul>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div>
                            <div className="text-[11px] uppercase">Postback URL</div>
                            <div className="rounded border border-indigo-200 bg-white px-2 py-1 font-mono text-[11px]">{postback?.endpoint}</div>
                        </div>
                        <div>
                            <div className="text-[11px] uppercase">Token</div>
                            <div className="rounded border border-indigo-200 bg-white px-2 py-1 font-mono text-[11px]">{postback?.token}</div>
                        </div>
                    </div>
                    <div className="mt-2 text-[11px]">Пример: {postback?.sample}</div>
                </section>

                <section className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-500">Публичный URL редиректа</div>
                            <a className="text-sm font-semibold text-indigo-700" href={redirectUrl} target="_blank" rel="noreferrer">{redirectUrl}</a>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`rounded px-3 py-2 text-xs font-semibold ${smartLink.is_active ? 'border border-amber-200 text-amber-700 hover:bg-amber-50' : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                                onClick={toggleCurrentSmartLink}
                            >
                                {smartLink.is_active ? 'Выключить' : 'Включить'}
                            </button>
                            <Link href={route('admin.smart-links.index')} className="rounded border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Назад</Link>
                        </div>
                    </div>

                    <form onSubmit={submit} className="mt-4 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <input className="rounded border px-3 py-2" placeholder="Название" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            <input className="rounded border px-3 py-2" placeholder="Slug" value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} />
                            <select className="rounded border px-3 py-2" value={form.data.fallback_offer_id} onChange={(e) => form.setData('fallback_offer_id', e.target.value)}>
                                <option value="">Фолбэк-оффер</option>
                                {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                            <input className="rounded border px-3 py-2" placeholder="Фолбэк URL" value={form.data.fallback_url} onChange={(e) => form.setData('fallback_url', e.target.value)} />
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />Активна</label>
                            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(form.data.is_public)} onChange={(e) => form.setData('is_public', e.target.checked)} />Публичный доступ</label>
                        </div>

                        <div className="rounded border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-semibold uppercase text-slate-600">Доступ вебмастеров</div>
                            <div className="mt-2 max-h-32 space-y-1 overflow-auto text-xs">
                                {webmasters.map((w) => (
                                    <label key={w.id} className="flex items-center gap-2">
                                        <input type="checkbox" checked={(form.data.webmaster_ids || []).includes(w.id)} onChange={(e) => toggleWebmaster(w.id, e.target.checked)} />
                                        {w.name} ({w.email})
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 rounded border border-indigo-100 bg-indigo-50/40 p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-indigo-900">Потоки</div>
                                <button type="button" onClick={addStream} className="rounded border border-indigo-300 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Добавить поток</button>
                            </div>

                            {form.data.streams.map((s, idx) => (
                                <div key={idx} className="space-y-3 rounded border bg-white p-3">
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <input className="rounded border px-2 py-2" placeholder="Название потока" value={s.name} onChange={(e) => updateStream(idx, { name: e.target.value })} />
                                        <input type="number" className="rounded border px-2 py-2" placeholder="Позиция потока" value={s.priority} onChange={(e) => updateStream(idx, { priority: e.target.value })} />
                                        <input type="number" className="rounded border px-2 py-2" placeholder="Вес потока" value={s.weight} onChange={(e) => updateStream(idx, { weight: e.target.value })} />
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                        <select className="rounded border px-2 py-2" value={s.offer_id} onChange={(e) => updateStream(idx, { offer_id: e.target.value })}>
                                            <option value="">Оффер (один)</option>
                                            {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                        <input className="rounded border px-2 py-2" placeholder="Или прямая ссылка (target URL)" value={s.target_url} onChange={(e) => updateStream(idx, { target_url: e.target.value })} />
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                        <input className="rounded border px-2 py-2" placeholder="Фильтр GEO (RU,KZ,UZ)" value={s.geos_csv} onChange={(e) => updateStream(idx, { geos_csv: e.target.value })} />
                                        <textarea className="rounded border px-2 py-2" placeholder={'Query-фильтры (опционально)\nutm_source=facebook'} value={s.query_input} onChange={(e) => updateStream(idx, { query_input: e.target.value })} />
                                    </div>

                                    <div className="rounded border border-slate-200 bg-slate-50 p-2">
                                        <div className="text-xs font-semibold text-slate-700">Фильтр по устройствам</div>
                                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                                            {DEVICES.map((device) => (
                                                <label key={device} className="inline-flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={(s.devices || []).includes(device)}
                                                        onChange={(e) => {
                                                            const current = s.devices || [];
                                                            updateStream(idx, { devices: e.target.checked ? [...current, device] : current.filter((d) => d !== device) });
                                                        }}
                                                    />
                                                    {DEVICE_LABELS[device] ?? device}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded border border-slate-200 bg-slate-50 p-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-semibold text-slate-700">Несколько офферов в потоке (распределение по весам)</div>
                                            <button type="button" className="rounded border px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100" onClick={() => addOfferWeight(idx)}>
                                                Добавить оффер
                                            </button>
                                        </div>
                                        <div className="mt-2 text-[11px] text-slate-500">Если список заполнен, он приоритетнее поля «Оффер (один)».</div>

                                        <div className="mt-2 space-y-2">
                                            {(s.offer_weights || []).map((row, rowIdx) => (
                                                <div key={rowIdx} className="grid gap-2 md:grid-cols-[1fr_140px_110px]">
                                                    <select className="rounded border px-2 py-2 text-sm" value={row.offer_id} onChange={(e) => updateOfferWeight(idx, rowIdx, { offer_id: e.target.value })}>
                                                        <option value="">Выберите оффер</option>
                                                        {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                                    </select>
                                                    <input type="number" className="rounded border px-2 py-2 text-sm" placeholder="Вес" value={row.weight} onChange={(e) => updateOfferWeight(idx, rowIdx, { weight: e.target.value })} />
                                                    <button type="button" className="rounded border border-red-200 px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => removeOfferWeight(idx, rowIdx)}>
                                                        Удалить
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs">
                                        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(s.is_active)} onChange={(e) => updateStream(idx, { is_active: e.target.checked })} />Активен</label>
                                        <button type="button" onClick={() => removeStream(idx)} className="ml-auto rounded border border-red-200 px-2 py-1 font-semibold text-red-600 hover:bg-red-50">Удалить поток</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {Object.keys(form.errors || {}).length > 0 ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{Object.entries(form.errors).map(([k, v]) => <div key={k}>{k}: {v}</div>)}</div> : null}
                        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" disabled={form.processing}>Сохранить SmartLink</button>
                    </form>
                </section>

                <section className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-gray-900">Лог кликов</h3>
                        <form onSubmit={submitFilters} className="flex flex-wrap items-center gap-2">
                            <input className="rounded border px-3 py-2 text-sm" placeholder="click_id" value={filters.data.click_id} onChange={(e) => filters.setData('click_id', e.target.value)} />
                            <input className="w-24 rounded border px-3 py-2 text-sm" placeholder="GEO" value={filters.data.geo} onChange={(e) => filters.setData('geo', e.target.value)} />
                            <select className="rounded border px-3 py-2 text-sm" value={filters.data.offer_id} onChange={(e) => filters.setData('offer_id', e.target.value)}>
                                <option value="">Все офферы</option>
                                {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                            <select className="rounded border px-3 py-2 text-sm" value={filters.data.stream_id} onChange={(e) => filters.setData('stream_id', e.target.value)}>
                                <option value="">Все потоки</option>
                                {(smartLink.streams || []).map((s) => <option key={s.id} value={s.id}>{s.name || `Поток #${s.id}`}</option>)}
                            </select>
                            <select className="rounded border px-3 py-2 text-sm" value={filters.data.webmaster_id} onChange={(e) => filters.setData('webmaster_id', e.target.value)}>
                                <option value="">Все вебмастера</option>
                                {webmasters.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Фильтр</button>
                        </form>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                                    <th className="px-3 py-2">Дата</th>
                                    <th className="px-3 py-2">Click ID</th>
                                    <th className="px-3 py-2">Поток</th>
                                    <th className="px-3 py-2">Оффер</th>
                                    <th className="px-3 py-2">Вебмастер</th>
                                    <th className="px-3 py-2">GEO</th>
                                    <th className="px-3 py-2">Устройство</th>
                                    <th className="px-3 py-2">Источник матчинга</th>
                                    <th className="px-3 py-2">Конверсия</th>
                                    <th className="px-3 py-2">Цель</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(clicks?.data || []).map((row) => (
                                    <tr key={row.id} className="border-b">
                                        <td className="px-3 py-2 text-xs text-gray-600">{formatDate(row.created_at)}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{row.click_id}</td>
                                        <td className="px-3 py-2">{row.stream?.name || `#${row.smart_link_stream_id || '-'}`}</td>
                                        <td className="px-3 py-2">{row.offer?.name || '-'}</td>
                                        <td className="px-3 py-2">{row.webmaster?.name || '-'}</td>
                                        <td className="px-3 py-2">{row.geo || '-'}</td>
                                        <td className="px-3 py-2">{row.device_type || '-'}</td>
                                        <td className="px-3 py-2">
                                            <span className={`rounded px-2 py-1 text-xs font-semibold ${row.is_fallback ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {row.matched_by || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs">{row.conversion_status ? `${row.conversion_status} | p:${row.conversion_payout ?? '-'} r:${row.conversion_revenue ?? '-'}` : '-'}</td>
                                        <td className="max-w-[380px] truncate px-3 py-2 text-xs text-gray-600" title={row.target_url || ''}>{row.target_url || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={clicks?.links} />
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

