import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

function Pagination({ links = [] }) {
    if (!Array.isArray(links) || links.length <= 3) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {links.map((link, idx) => {
                const label = link.label
                    .replace('&laquo; Previous', 'Previous')
                    .replace('Next &raquo;', 'Next');

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

export default function Index({ smartLinks, offers, presets, filters = {} }) {
    const { flash } = usePage().props;

    const searchForm = useForm({
        search: filters.search ?? '',
        status: filters.status ?? '',
        per_page: filters.per_page ?? 10,
    });

    const presetForm = useForm({
        name: '',
        description: '',
        default_weight: 100,
        default_priority: 0,
        geos_csv: '',
        query_json: '',
        devices: [],
        is_active: true,
    });

    const createForm = useForm({
        name: '',
        slug: '',
        is_active: true,
        fallback_offer_id: '',
        fallback_url: '',
        streams: [
            {
                name: 'A',
                offer_id: '',
                preset_id: '',
                weight: 50,
                priority: 0,
                target_url: '',
                geos_csv: '',
                query_json: '',
                devices: [],
                is_active: true,
            },
            {
                name: 'B',
                offer_id: '',
                preset_id: '',
                weight: 50,
                priority: 0,
                target_url: '',
                geos_csv: '',
                query_json: '',
                devices: [],
                is_active: true,
            },
        ],
    });

    const submitSearch = (e) => {
        e.preventDefault();
        searchForm.get(route('admin.smart-links.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const addStream = () => {
        createForm.setData('streams', [
            ...createForm.data.streams,
            {
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

    const removeStream = (idx) => {
        createForm.setData('streams', createForm.data.streams.filter((_, i) => i !== idx));
    };

    const updateStream = (idx, patch) => {
        createForm.setData(
            'streams',
            createForm.data.streams.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
        );
    };

    const submitPreset = (e) => {
        e.preventDefault();

        presetForm.transform((data) => ({
            name: data.name,
            description: data.description,
            default_weight: Number(data.default_weight || 100),
            default_priority: Number(data.default_priority || 0),
            is_active: Boolean(data.is_active),
            rules: {
                geos: data.geos_csv
                    .split(',')
                    .map((x) => x.trim().toUpperCase())
                    .filter(Boolean),
                devices: data.devices,
                query: parseJsonObject(data.query_json),
            },
        })).post(route('admin.smart-link-presets.store'), {
            preserveScroll: true,
            onSuccess: () => {
                presetForm.reset();
                presetForm.setData('default_weight', 100);
                presetForm.setData('default_priority', 0);
                presetForm.setData('is_active', true);
            },
        });
    };

    const submitCreate = (e) => {
        e.preventDefault();

        createForm.transform((data) => ({
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
        })).post(route('admin.smart-links.store'), {
            preserveScroll: true,
        });
    };

    const presetUsage = (preset) => {
        const geos = Array.isArray(preset.rules?.geos) ? preset.rules.geos.join(', ') : '';
        const devices = Array.isArray(preset.rules?.devices) ? preset.rules.devices.join(', ') : '';
        return [geos && `geo: ${geos}`, devices && `devices: ${devices}`].filter(Boolean).join(' | ') || 'No rules';
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">SmartLinks</h2>}>
            <Head title="SmartLinks" />

            <div className="space-y-6">
                {flash?.success ? (
                    <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{flash.success}</div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900">Create SmartLink</h3>
                        <form onSubmit={submitCreate} className="mt-3 space-y-3">
                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    required
                                />
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Slug (optional)"
                                    value={createForm.data.slug}
                                    onChange={(e) => createForm.setData('slug', e.target.value)}
                                />
                                <select
                                    className="rounded border px-3 py-2"
                                    value={createForm.data.fallback_offer_id}
                                    onChange={(e) => createForm.setData('fallback_offer_id', e.target.value)}
                                >
                                    <option value="">Fallback offer (optional)</option>
                                    {offers.map((offer) => (
                                        <option key={offer.id} value={offer.id}>{offer.name}</option>
                                    ))}
                                </select>
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Fallback URL (optional)"
                                    value={createForm.data.fallback_url}
                                    onChange={(e) => createForm.setData('fallback_url', e.target.value)}
                                />
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={createForm.data.is_active}
                                    onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                />
                                Active
                            </label>

                            <div className="space-y-3 rounded border border-indigo-100 bg-indigo-50/40 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-indigo-900">Streams (A/B + rules + weights)</div>
                                    <button type="button" onClick={addStream} className="rounded border border-indigo-300 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                                        Add stream
                                    </button>
                                </div>

                                {createForm.data.streams.map((stream, idx) => (
                                    <div key={idx} className="rounded border bg-white p-3">
                                        <div className="grid gap-2 md:grid-cols-3">
                                            <input
                                                className="rounded border px-2 py-2"
                                                placeholder="Stream name"
                                                value={stream.name}
                                                onChange={(e) => updateStream(idx, { name: e.target.value })}
                                            />
                                            <select
                                                className="rounded border px-2 py-2"
                                                value={stream.offer_id}
                                                onChange={(e) => updateStream(idx, { offer_id: e.target.value })}
                                            >
                                                <option value="">Offer (optional if target URL set)</option>
                                                {offers.map((offer) => (
                                                    <option key={offer.id} value={offer.id}>{offer.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="rounded border px-2 py-2"
                                                value={stream.preset_id}
                                                onChange={(e) => updateStream(idx, { preset_id: e.target.value })}
                                            >
                                                <option value="">Preset (optional)</option>
                                                {presets.filter((p) => p.is_active).map((preset) => (
                                                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                className="rounded border px-2 py-2"
                                                placeholder="Weight"
                                                value={stream.weight}
                                                onChange={(e) => updateStream(idx, { weight: e.target.value })}
                                            />
                                            <input
                                                type="number"
                                                className="rounded border px-2 py-2"
                                                placeholder="Priority"
                                                value={stream.priority}
                                                onChange={(e) => updateStream(idx, { priority: e.target.value })}
                                            />
                                            <input
                                                className="rounded border px-2 py-2"
                                                placeholder="Target URL (optional if offer set)"
                                                value={stream.target_url}
                                                onChange={(e) => updateStream(idx, { target_url: e.target.value })}
                                            />
                                            <input
                                                className="rounded border px-2 py-2"
                                                placeholder="Geo rules (RU,KZ,UZ)"
                                                value={stream.geos_csv}
                                                onChange={(e) => updateStream(idx, { geos_csv: e.target.value })}
                                            />
                                            <input
                                                className="rounded border px-2 py-2 md:col-span-2"
                                                placeholder='Query rules JSON, example: {"utm_source":"facebook"}'
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
                                                active
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => removeStream(idx)}
                                                className="ml-auto rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {Object.values(createForm.errors || {}).length > 0 ? (
                                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                    {Object.entries(createForm.errors).map(([k, v]) => (
                                        <div key={k}>{k}: {v}</div>
                                    ))}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                disabled={createForm.processing}
                            >
                                Create SmartLink
                            </button>
                        </form>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900">Stream Presets</h3>
                        <form onSubmit={submitPreset} className="mt-3 space-y-2">
                            <div className="grid gap-2 md:grid-cols-2">
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Preset name"
                                    value={presetForm.data.name}
                                    onChange={(e) => presetForm.setData('name', e.target.value)}
                                    required
                                />
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Description"
                                    value={presetForm.data.description}
                                    onChange={(e) => presetForm.setData('description', e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="rounded border px-3 py-2"
                                    placeholder="Default weight"
                                    value={presetForm.data.default_weight}
                                    onChange={(e) => presetForm.setData('default_weight', e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="rounded border px-3 py-2"
                                    placeholder="Default priority"
                                    value={presetForm.data.default_priority}
                                    onChange={(e) => presetForm.setData('default_priority', e.target.value)}
                                />
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder="Geo rules (RU,KZ,UZ)"
                                    value={presetForm.data.geos_csv}
                                    onChange={(e) => presetForm.setData('geos_csv', e.target.value)}
                                />
                                <input
                                    className="rounded border px-3 py-2"
                                    placeholder='Query rules JSON: {"utm_source":"fb"}'
                                    value={presetForm.data.query_json}
                                    onChange={(e) => presetForm.setData('query_json', e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                {['desktop', 'mobile', 'tablet'].map((device) => (
                                    <label key={device} className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={presetForm.data.devices.includes(device)}
                                            onChange={(e) => {
                                                presetForm.setData(
                                                    'devices',
                                                    e.target.checked
                                                        ? [...presetForm.data.devices, device]
                                                        : presetForm.data.devices.filter((d) => d !== device),
                                                );
                                            }}
                                        />
                                        {device}
                                    </label>
                                ))}
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={presetForm.data.is_active}
                                        onChange={(e) => presetForm.setData('is_active', e.target.checked)}
                                    />
                                    active
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                disabled={presetForm.processing}
                            >
                                Add preset
                            </button>
                        </form>

                        <div className="mt-4 space-y-2">
                            {presets.length === 0 ? <div className="text-sm text-gray-500">No presets yet.</div> : null}
                            {presets.map((preset) => (
                                <div key={preset.id} className="rounded border px-3 py-2 text-sm">
                                    <div className="font-semibold text-gray-800">{preset.name} {!preset.is_active ? '(inactive)' : ''}</div>
                                    <div className="text-xs text-gray-600">weight: {preset.default_weight}, priority: {preset.default_priority}</div>
                                    <div className="text-xs text-gray-500">{presetUsage(preset)}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-gray-900">SmartLinks</h3>
                        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
                            <input
                                className="rounded border px-3 py-2 text-sm"
                                placeholder="Search by name/slug"
                                value={searchForm.data.search}
                                onChange={(e) => searchForm.setData('search', e.target.value)}
                            />
                            <select
                                className="rounded border px-3 py-2 text-sm"
                                value={searchForm.data.status}
                                onChange={(e) => searchForm.setData('status', e.target.value)}
                            >
                                <option value="">All statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Filter</button>
                        </form>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Slug</th>
                                    <th className="px-3 py-2">Streams</th>
                                    <th className="px-3 py-2">Clicks</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(smartLinks?.data || []).map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="px-3 py-2 font-semibold text-gray-800">{item.name}</td>
                                        <td className="px-3 py-2 text-gray-600">{item.slug}</td>
                                        <td className="px-3 py-2">{item.streams_count}</td>
                                        <td className="px-3 py-2">{item.clicks_count}</td>
                                        <td className="px-3 py-2">
                                            <span className={`rounded px-2 py-1 text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.is_active ? 'active' : 'inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link href={route('admin.smart-links.show', item.id)} className="rounded border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Open</Link>
                                                <Link href={route('admin.smart-links.toggle', item.id)} method="patch" as="button" className="rounded border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">Toggle</Link>
                                                <Link href={route('admin.smart-links.destroy', item.id)} method="delete" as="button" className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</Link>
                                            </div>
                                        </td>
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
