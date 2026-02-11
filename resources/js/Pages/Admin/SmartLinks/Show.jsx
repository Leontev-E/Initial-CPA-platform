import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

function parseJsonObject(text) {
    if (!text || !text.trim()) {
        return {};
    }

    try {
        const parsed = JSON.parse(text);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function formatDate(value) {
    if (!value) return '—';
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

function Pagination({ links = [] }) {
    if (!Array.isArray(links) || links.length <= 3) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {links.map((link, idx) => {
                const label = link.label
                    .replace('&laquo; Previous', 'Предыдущая')
                    .replace('Next &raquo;', 'Следующая');

                if (!link.url) {
                    return (
                        <span
                            key={idx}
                            className="rounded border border-gray-200 px-3 py-1 text-gray-400"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }

                return (
                    <Link
                        key={idx}
                        href={link.url}
                        className={`rounded border px-3 py-1 ${link.active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </div>
    );
}

export default function Show({ smartLink, offers, presets, clicks, clickFilters = {}, redirectUrl }) {
    const { flash } = usePage().props;

    const form = useForm({
        name: smartLink.name,
        slug: smartLink.slug,
        is_active: Boolean(smartLink.is_active),
        fallback_offer_id: smartLink.fallback_offer_id || '',
        fallback_url: smartLink.fallback_url || '',
        streams: (smartLink.streams || []).map((stream) => ({
            id: stream.id,
            name: stream.name || '',
            offer_id: stream.offer_id || '',
            preset_id: stream.preset_id || '',
            weight: stream.weight ?? 100,
            priority: stream.priority ?? 0,
            target_url: stream.target_url || '',
            geos_csv: (stream.rules?.geos || []).join(','),
            query_json: JSON.stringify(stream.rules?.query || {}),
            devices: stream.rules?.devices || [],
            is_active: Boolean(stream.is_active),
        })),
    });

    const clickFilterForm = useForm({
        click_id: clickFilters.click_id ?? '',
        geo: clickFilters.geo ?? '',
        offer_id: clickFilters.offer_id ?? '',
        stream_id: clickFilters.stream_id ?? '',
    });

    const addStream = () => {
        form.setData('streams', [
            ...form.data.streams,
            {
                id: null,
                name: '',
                offer_id: '',
                preset_id: '',
                weight: 100,
                priority: 0,
                target_url: '',
                geos_csv: '',
                query_json: '',
                devices: [],
                is_active: true,
            },
        ]);
    };

    const updateStream = (idx, patch) => {
        form.setData('streams', form.data.streams.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    };

    const removeStream = (idx) => {
        form.setData('streams', form.data.streams.filter((_, i) => i !== idx));
    };

    const submit = (e) => {
        e.preventDefault();

        form.transform((data) => ({
            name: data.name,
            slug: data.slug,
            is_active: Boolean(data.is_active),
            fallback_offer_id: data.fallback_offer_id || null,
            fallback_url: data.fallback_url || null,
            streams: data.streams.map((stream) => ({
                name: stream.name,
                offer_id: stream.offer_id || null,
                preset_id: stream.preset_id || null,
                weight: Number(stream.weight || 0),
                priority: Number(stream.priority || 0),
                target_url: stream.target_url || null,
                is_active: Boolean(stream.is_active),
                rules: {
                    geos: (stream.geos_csv || '')
                        .split(',')
                        .map((x) => x.trim().toUpperCase())
                        .filter(Boolean),
                    devices: stream.devices || [],
                    query: parseJsonObject(stream.query_json),
                },
            })),
        })).patch(route('admin.smart-links.update', smartLink.id), {
            preserveScroll: true,
        });
    };

    const submitClickFilters = (e) => {
        e.preventDefault();
        clickFilterForm.get(route('admin.smart-links.show', smartLink.id), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Смартлинк: {smartLink.name}</h2>}>
            <Head title={`Смартлинк ${smartLink.name}`} />

            <div className="space-y-6">
                {flash?.success ? (
                    <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{flash.success}</div>
                ) : null}

                <section className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-500">Публичная ссылка</div>
                            <a className="text-sm font-semibold text-indigo-700" href={redirectUrl} target="_blank" rel="noreferrer">
                                {redirectUrl}
                            </a>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('admin.smart-links.toggle', smartLink.id)} method="patch" as="button" className="rounded border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                                Переключить
                            </Link>
                            <Link href={route('admin.smart-links.index')} className="rounded border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                Назад
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={submit} className="mt-4 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <input
                                className="rounded border px-3 py-2"
                                placeholder="Название"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                            />
                            <input
                                className="rounded border px-3 py-2"
                                placeholder="Slug"
                                value={form.data.slug}
                                onChange={(e) => form.setData('slug', e.target.value)}
                            />
                            <select
                                className="rounded border px-3 py-2"
                                value={form.data.fallback_offer_id}
                                onChange={(e) => form.setData('fallback_offer_id', e.target.value)}
                            >
                                <option value="">Fallback оффер (опционально)</option>
                                {offers.map((offer) => (
                                    <option key={offer.id} value={offer.id}>{offer.name}</option>
                                ))}
                            </select>
                            <input
                                className="rounded border px-3 py-2"
                                placeholder="Fallback URL (опционально)"
                                value={form.data.fallback_url}
                                onChange={(e) => form.setData('fallback_url', e.target.value)}
                            />
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                            />
                            Активен
                        </label>

                        <div className="space-y-3 rounded border border-indigo-100 bg-indigo-50/40 p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-indigo-900">Потоки (стримы)</div>
                                <button type="button" onClick={addStream} className="rounded border border-indigo-300 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                                    Добавить поток
                                </button>
                            </div>

                            {form.data.streams.map((stream, idx) => (
                                <div key={idx} className="rounded border bg-white p-3">
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <input
                                            className="rounded border px-2 py-2"
                                            placeholder="Название потока"
                                            value={stream.name}
                                            onChange={(e) => updateStream(idx, { name: e.target.value })}
                                        />
                                        <select
                                            className="rounded border px-2 py-2"
                                            value={stream.offer_id}
                                            onChange={(e) => updateStream(idx, { offer_id: e.target.value })}
                                        >
                                            <option value="">Оффер (опционально, если указан target URL)</option>
                                            {offers.map((offer) => (
                                                <option key={offer.id} value={offer.id}>{offer.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="rounded border px-2 py-2"
                                            value={stream.preset_id}
                                            onChange={(e) => updateStream(idx, { preset_id: e.target.value })}
                                        >
                                            <option value="">Пресет (опционально)</option>
                                            {presets.filter((p) => p.is_active).map((preset) => (
                                                <option key={preset.id} value={preset.id}>{preset.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            className="rounded border px-2 py-2"
                                            placeholder="Вес"
                                            value={stream.weight}
                                            onChange={(e) => updateStream(idx, { weight: e.target.value })}
                                        />
                                        <input
                                            type="number"
                                            className="rounded border px-2 py-2"
                                            placeholder="Приоритет"
                                            value={stream.priority}
                                            onChange={(e) => updateStream(idx, { priority: e.target.value })}
                                        />
                                        <input
                                            className="rounded border px-2 py-2"
                                            placeholder="Target URL"
                                            value={stream.target_url}
                                            onChange={(e) => updateStream(idx, { target_url: e.target.value })}
                                        />
                                        <input
                                            className="rounded border px-2 py-2"
                                            placeholder="Правила GEO (RU,KZ,UZ)"
                                            value={stream.geos_csv}
                                            onChange={(e) => updateStream(idx, { geos_csv: e.target.value })}
                                        />
                                        <input
                                            className="rounded border px-2 py-2 md:col-span-2"
                                            placeholder='Query-правила JSON: {"utm_source":"facebook"}'
                                            value={stream.query_json}
                                            onChange={(e) => updateStream(idx, { query_json: e.target.value })}
                                        />
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-4">
                                        {['desktop', 'mobile', 'tablet'].map((device) => (
                                            <label key={device} className="inline-flex items-center gap-2 text-xs text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={(stream.devices || []).includes(device)}
                                                    onChange={(e) => {
                                                        const current = stream.devices || [];
                                                        updateStream(idx, {
                                                            devices: e.target.checked
                                                                ? [...current, device]
                                                                : current.filter((d) => d !== device),
                                                        });
                                                    }}
                                                />
                                                {device}
                                            </label>
                                        ))}

                                        <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(stream.is_active)}
                                                onChange={(e) => updateStream(idx, { is_active: e.target.checked })}
                                            />
                                            активен
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => removeStream(idx)}
                                            className="ml-auto rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {Object.values(form.errors || {}).length > 0 ? (
                            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {Object.entries(form.errors).map(([k, v]) => (
                                    <div key={k}>{k}: {v}</div>
                                ))}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            disabled={form.processing}
                        >
                            Сохранить SmartLink
                        </button>
                    </form>
                </section>

                <section className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-gray-900">Лог кликов</h3>
                        <form onSubmit={submitClickFilters} className="flex flex-wrap items-center gap-2">
                            <input
                                className="rounded border px-3 py-2 text-sm"
                                placeholder="click_id"
                                value={clickFilterForm.data.click_id}
                                onChange={(e) => clickFilterForm.setData('click_id', e.target.value)}
                            />
                            <input
                                className="w-24 rounded border px-3 py-2 text-sm"
                                placeholder="GEO"
                                value={clickFilterForm.data.geo}
                                onChange={(e) => clickFilterForm.setData('geo', e.target.value)}
                            />
                            <select
                                className="rounded border px-3 py-2 text-sm"
                                value={clickFilterForm.data.offer_id}
                                onChange={(e) => clickFilterForm.setData('offer_id', e.target.value)}
                            >
                                <option value="">Все офферы</option>
                                {offers.map((offer) => (
                                    <option key={offer.id} value={offer.id}>{offer.name}</option>
                                ))}
                            </select>
                            <select
                                className="rounded border px-3 py-2 text-sm"
                                value={clickFilterForm.data.stream_id}
                                onChange={(e) => clickFilterForm.setData('stream_id', e.target.value)}
                            >
                                <option value="">Все потоки</option>
                                {(smartLink.streams || []).map((stream) => (
                                    <option key={stream.id} value={stream.id}>{stream.name || `Stream #${stream.id}`}</option>
                                ))}
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
                                    <th className="px-3 py-2">GEO</th>
                                    <th className="px-3 py-2">Устройство</th>
                                    <th className="px-3 py-2">Правило</th>
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
                                        <td className="px-3 py-2">{row.geo || '-'}</td>
                                        <td className="px-3 py-2">{row.device_type || '-'}</td>
                                        <td className="px-3 py-2">
                                            <span className={`rounded px-2 py-1 text-xs font-semibold ${row.is_fallback ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {row.matched_by || '-'}
                                            </span>
                                        </td>
                                        <td className="max-w-[420px] truncate px-3 py-2 text-xs text-gray-600" title={row.target_url || ''}>{row.target_url || '-'}</td>
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
