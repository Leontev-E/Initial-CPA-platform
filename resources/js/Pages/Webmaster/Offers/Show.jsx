import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Show({ offer, apiKey }) {
    const [copied, setCopied] = useState(false);
    const [selectedGeo, setSelectedGeo] = useState(() => (offer.allowed_geos && offer.allowed_geos.length ? offer.allowed_geos[0] : ''));
    const [showApiKey, setShowApiKey] = useState(false);

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(String(offer.id));
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            // ignore
        }
    };

    const formatText = (text) => (text || '').trim();

    const hasManyGeos = useMemo(() => (offer.allowed_geos || []).length > 1, [offer.allowed_geos]);

    const downloadApi = () => {
        const params = hasManyGeos && selectedGeo ? { geo: selectedGeo } : {};
        const url = route('webmaster.offers.apiScript', { offer: offer.id, ...params });
        window.location.href = url;
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">{offer.name}</h2>}
        >
            <Head title={offer.name} />
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">ID оффера:</span>
                        <button
                            type="button"
                            onClick={copyId}
                            className="rounded border border-indigo-200 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                            {offer.id}
                        </button>
                        {copied && <span className="text-emerald-600">скопировано</span>}
                    </div>
                    {offer.image_url && (
                        <img
                            src={offer.image_url}
                            alt={offer.name}
                            className="h-52 w-full rounded object-contain bg-slate-50"
                        />
                    )}
                    <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                        <div className="text-xs uppercase text-gray-500">Описание</div>
                        <div>{formatText(offer.description)}</div>
                    </div>
                    {offer.notes && (
                        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-gray-800">
                            <div className="text-xs uppercase text-amber-600">Примечание</div>
                            <div className="whitespace-pre-line">{formatText(offer.notes)}</div>
                        </div>
                    )}
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm space-y-3 text-sm text-gray-700">
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
                        <div className="text-sm font-semibold text-indigo-900">Скачать api.php</div>
                        <div className="mt-1 text-xs text-indigo-800">
                            Файл для отправки лидов в пару кликов. Внутри уже подставлены ваш API-ключ и ID оффера.
                        </div>
                        <div className="mt-2 space-y-2">
                            <div>
                                <div className="text-[11px] uppercase text-gray-600">API ключ</div>
                                <div className="flex items-center gap-2">
                                    <div className={`font-mono break-all text-xs text-gray-900 ${showApiKey ? '' : 'filter blur-sm select-none'}`}>
                                        {apiKey?.key}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="rounded border px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        {showApiKey ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            </div>
                            {hasManyGeos && (
                                <div>
                                    <div className="text-[11px] uppercase text-gray-600">GEO для файла</div>
                                    <select
                                        className="h-10 w-full rounded border px-3 text-sm"
                                        value={selectedGeo}
                                        onChange={(e) => setSelectedGeo(e.target.value)}
                                    >
                                        {(offer.allowed_geos || []).map((geo) => (
                                            <option key={geo} value={geo}>{geo}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={downloadApi}
                                className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Скачать api.php
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500">GEO</div>
                        <div>{(offer.allowed_geos || []).join(', ') || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500">Ставка по умолчанию</div>
                        <div>{offer.default_payout} $</div>
                    </div>
                    <div className="font-semibold text-indigo-700">
                        Ваша ставка: {offer.effective_payout} $
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500">Материалы</div>
                        {offer.materials_link ? (
                            <a
                                href={offer.materials_link}
                                target="_blank"
                                className="text-indigo-700 underline"
                                rel="noreferrer"
                            >
                                Открыть материалы
                            </a>
                        ) : (
                            <div className="text-gray-500">Не указаны</div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500">График КЦ</div>
                        <div className="text-gray-700">
                            {offer.call_center_hours || 'Не указан'}{' '}
                            {offer.call_center_hours && (
                                <span className="text-xs text-gray-500">
                                    ({offer.call_center_timezone === 'msk' ? 'МСК' : 'Местное время'})
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="pt-2">
                        <div className="text-xs uppercase text-gray-500">Лендинги</div>
                        <div className="mt-2 divide-y rounded border">
                            {(offer.landings || []).map((landing) => (
                                <div key={landing.id} className="flex flex-col gap-1 px-3 py-2">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-gray-900">{landing.name}</div>
                                        <span className={`rounded px-2 py-1 text-[11px] font-semibold ${landing.type === 'local' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {landing.type === 'local' ? 'Локальный' : 'Ссылка'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {landing.preview_url && (
                                            <a
                                                href={route('landings.preview', landing.id)}
                                                target="_blank"
                                                className="rounded border border-indigo-200 px-2 py-1 font-semibold text-indigo-700 hover:bg-indigo-50"
                                            >
                                                Открыть
                                            </a>
                                        )}
                                        {landing.download_url && (
                                            <a
                                                href={route('landings.download', landing.id)}
                                                className="rounded border border-gray-200 px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                Скачать
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(offer.landings || []).length === 0 && (
                                <div className="px-3 py-4 text-center text-xs text-gray-500">
                                    Лендингов нет
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
