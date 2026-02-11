import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const DEVICES = ['desktop', 'mobile', 'tablet'];

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

function Pagination({ links = [] }) {
    if (!Array.isArray(links) || links.length <= 3) return null;
    return (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {links.map((link, idx) => (
                link.url ? (
                    <Link
                        key={idx}
                        href={link.url}
                        className={`rounded border px-3 py-1 ${link.active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span key={idx} className="rounded border border-gray-200 px-3 py-1 text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                )
            ))}
        </div>
    );
}

export default function Index({ smartLinks, offers, presets, webmasters = [], filters = {} }) {
    const { flash } = usePage().props;
    const searchForm = useForm({ search: filters.search ?? '', status: filters.status ?? '', per_page: filters.per_page ?? 10 });
    const presetForm = useForm({ name: '', default_weight: 100, default_priority: 0, geos_csv: '', query_input: '', devices: [], is_active: true });
    const form = useForm({
        name: '',
        slug: '',
        is_active: true,
        is_public: true,
        fallback_offer_id: '',
        fallback_url: '',
        webmaster_ids: [],
        streams: [{ name: 'A', offer_id: '', preset_id: '', weight: 100, priority: 0, target_url: '', geos_csv: '', query_input: '', devices: [], is_active: true }],
    });

    const submitSearch = (e) => {
        e.preventDefault();
        searchForm.get(route('admin.smart-links.index'), { preserveState: true, preserveScroll: true, replace: true });
    };

    const updateStream = (idx, patch) => {
        form.setData('streams', form.data.streams.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    };

    const addStream = () => {
        form.setData('streams', [...form.data.streams, { name: '', offer_id: '', preset_id: '', weight: 100, priority: 0, target_url: '', geos_csv: '', query_input: '', devices: [], is_active: true }]);
    };

    const removeStream = (idx) => {
        form.setData('streams', form.data.streams.filter((_, i) => i !== idx));
    };

    const toggleWebmaster = (id, checked) => {
        const current = form.data.webmaster_ids || [];
        form.setData('webmaster_ids', checked ? Array.from(new Set([...current, id])) : current.filter((x) => x !== id));
    };

    const submitPreset = (e) => {
        e.preventDefault();
        presetForm.transform((data) => ({
            name: data.name,
            default_weight: Number(data.default_weight || 100),
            default_priority: Number(data.default_priority || 0),
            is_active: Boolean(data.is_active),
            rules: {
                geos: (data.geos_csv || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean),
                devices: data.devices || [],
                query: parseQueryRules(data.query_input),
            },
        }));
        presetForm.post(route('admin.smart-link-presets.store'), { preserveScroll: true, onSuccess: () => presetForm.reset() });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            name: data.name,
            slug: data.slug || null,
            is_active: Boolean(data.is_active),
            is_public: Boolean(data.is_public),
            fallback_offer_id: data.fallback_offer_id || null,
            fallback_url: data.fallback_url || null,
            webmaster_ids: data.webmaster_ids || [],
            streams: data.streams.map((s) => ({
                name: s.name || null,
                offer_id: s.offer_id || null,
                preset_id: s.preset_id || null,
                weight: Number(s.weight || 0),
                priority: Number(s.priority || 0),
                target_url: s.target_url || null,
                is_active: Boolean(s.is_active),
                rules: {
                    geos: (s.geos_csv || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean),
                    devices: s.devices || [],
                    query: parseQueryRules(s.query_input),
                },
            })),
        }));
        form.post(route('admin.smart-links.store'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Смарт-ссылки</h2>}>
            <Head title="Смарт-ссылки" />
            <div className="space-y-6">
                {flash?.success ? <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{flash.success}</div> : null}

                <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                    <div className="font-semibold">Гайд по SmartLink</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                        <li>Query-правила можно задавать в формате JSON или построчно, например <code>utm_source=facebook</code>, <code>sub1=*</code>.</li>
                        <li>Отключите публичный доступ и выберите вебмастеров, чтобы получить приватные токенизированные ссылки.</li>
                        <li>Каждый редирект содержит <code>click_id</code>, его нужно использовать для матчинга конверсий в postback.</li>
                    </ul>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900">Создать SmartLink</h3>
                        <form onSubmit={submitCreate} className="mt-3 space-y-3">
                            <div className="grid gap-2 md:grid-cols-2">
                                <input className="rounded border px-3 py-2" placeholder="Название" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                <input className="rounded border px-3 py-2" placeholder="Slug (необязательно)" value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} />
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
                                            <span>{w.name} ({w.email})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 rounded border border-indigo-100 bg-indigo-50/40 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-indigo-900">Потоки</div>
                                    <button type="button" onClick={addStream} className="rounded border border-indigo-300 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Добавить поток</button>
                                </div>
                                {form.data.streams.map((stream, idx) => (
                                    <div key={idx} className="space-y-2 rounded border bg-white p-3">
                                        <div className="grid gap-2 md:grid-cols-3">
                                            <input className="rounded border px-2 py-2" placeholder="Название" value={stream.name} onChange={(e) => updateStream(idx, { name: e.target.value })} />
                                            <select className="rounded border px-2 py-2" value={stream.offer_id} onChange={(e) => updateStream(idx, { offer_id: e.target.value })}>
                                                <option value="">Оффер</option>
                                                {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                            </select>
                                            <select className="rounded border px-2 py-2" value={stream.preset_id} onChange={(e) => updateStream(idx, { preset_id: e.target.value })}>
                                                <option value="">Пресет</option>
                                                {presets.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <input type="number" className="rounded border px-2 py-2" placeholder="Вес" value={stream.weight} onChange={(e) => updateStream(idx, { weight: e.target.value })} />
                                            <input type="number" className="rounded border px-2 py-2" placeholder="Приоритет" value={stream.priority} onChange={(e) => updateStream(idx, { priority: e.target.value })} />
                                            <input className="rounded border px-2 py-2" placeholder="Целевой URL" value={stream.target_url} onChange={(e) => updateStream(idx, { target_url: e.target.value })} />
                                            <input className="rounded border px-2 py-2" placeholder="GEO-правила (RU,KZ)" value={stream.geos_csv} onChange={(e) => updateStream(idx, { geos_csv: e.target.value })} />
                                            <textarea className="rounded border px-2 py-2 md:col-span-2" placeholder={'Query-правила (JSON или строки)\nutm_source=facebook'} value={stream.query_input} onChange={(e) => updateStream(idx, { query_input: e.target.value })} />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-xs">
                                            {DEVICES.map((device) => (
                                                <label key={device} className="inline-flex items-center gap-2">
                                                    <input type="checkbox" checked={(stream.devices || []).includes(device)} onChange={(e) => {
                                                        const current = stream.devices || [];
                                                        updateStream(idx, { devices: e.target.checked ? [...current, device] : current.filter((d) => d !== device) });
                                                    }} />
                                                    {device}
                                                </label>
                                            ))}
                                            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(stream.is_active)} onChange={(e) => updateStream(idx, { is_active: e.target.checked })} />активен</label>
                                            <button type="button" onClick={() => removeStream(idx)} className="ml-auto rounded border border-red-200 px-2 py-1 font-semibold text-red-600 hover:bg-red-50">Удалить</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {Object.keys(form.errors || {}).length > 0 ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{Object.entries(form.errors).map(([k, v]) => <div key={k}>{k}: {v}</div>)}</div> : null}
                            <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" disabled={form.processing}>Создать SmartLink</button>
                        </form>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900">Быстрый пресет</h3>
                        <form onSubmit={submitPreset} className="mt-3 space-y-2">
                            <input className="w-full rounded border px-3 py-2" placeholder="Название пресета" value={presetForm.data.name} onChange={(e) => presetForm.setData('name', e.target.value)} required />
                            <div className="grid gap-2 md:grid-cols-2">
                                <input type="number" className="rounded border px-3 py-2" placeholder="Вес" value={presetForm.data.default_weight} onChange={(e) => presetForm.setData('default_weight', e.target.value)} />
                                <input type="number" className="rounded border px-3 py-2" placeholder="Приоритет" value={presetForm.data.default_priority} onChange={(e) => presetForm.setData('default_priority', e.target.value)} />
                                <input className="rounded border px-3 py-2" placeholder="GEO-правила (RU,KZ)" value={presetForm.data.geos_csv} onChange={(e) => presetForm.setData('geos_csv', e.target.value)} />
                                <textarea className="rounded border px-3 py-2" placeholder="Query-правила" value={presetForm.data.query_input} onChange={(e) => presetForm.setData('query_input', e.target.value)} />
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm">
                                {DEVICES.map((device) => (
                                    <label key={device} className="inline-flex items-center gap-2">
                                        <input type="checkbox" checked={presetForm.data.devices.includes(device)} onChange={(e) => presetForm.setData('devices', e.target.checked ? [...presetForm.data.devices, device] : presetForm.data.devices.filter((d) => d !== device))} />
                                        {device}
                                    </label>
                                ))}
                            </div>
                            <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" disabled={presetForm.processing}>Добавить пресет</button>
                        </form>
                    </section>
                </div>

                <section className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-gray-900">Смарт-ссылки</h3>
                        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
                            <input className="rounded border px-3 py-2 text-sm" placeholder="Поиск" value={searchForm.data.search} onChange={(e) => searchForm.setData('search', e.target.value)} />
                            <select className="rounded border px-3 py-2 text-sm" value={searchForm.data.status} onChange={(e) => searchForm.setData('status', e.target.value)}>
                                <option value="">Все</option><option value="active">Активные</option><option value="inactive">Неактивные</option>
                            </select>
                            <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Фильтр</button>
                        </form>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500"><th className="px-3 py-2">Название</th><th className="px-3 py-2">Slug</th><th className="px-3 py-2">Потоки</th><th className="px-3 py-2">Клики</th><th className="px-3 py-2">Вебмастера</th><th className="px-3 py-2">Доступ</th><th className="px-3 py-2">Статус</th><th className="px-3 py-2">Действия</th></tr></thead>
                            <tbody>
                                {(smartLinks?.data || []).map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="px-3 py-2 font-semibold">{item.name}</td><td className="px-3 py-2">{item.slug}</td><td className="px-3 py-2">{item.streams_count}</td><td className="px-3 py-2">{item.clicks_count}</td><td className="px-3 py-2">{item.assignments_count ?? 0}</td>
                                        <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-xs font-semibold ${item.is_public ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{item.is_public ? 'публичный' : 'приватный'}</span></td>
                                        <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.is_active ? 'активна' : 'неактивна'}</span></td>
                                        <td className="px-3 py-2"><div className="flex flex-wrap gap-2"><Link href={route('admin.smart-links.show', item.id)} className="rounded border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Открыть</Link><Link href={route('admin.smart-links.toggle', item.id)} method="patch" as="button" className="rounded border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">Переключить</Link><Link href={route('admin.smart-links.destroy', item.id)} method="delete" as="button" className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Удалить</Link></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={smartLinks?.links} />
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
