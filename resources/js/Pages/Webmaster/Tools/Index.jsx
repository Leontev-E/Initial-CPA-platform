import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ apiKey, postbacks, logs, smartLinks = [], filters, eventOptions = [] }) {
    const [tab, setTab] = useState('api');
    const [showKey, setShowKey] = useState(false);
    const { post } = useForm({});
    const defaultEvents = eventOptions?.length ? eventOptions : ['lead', 'in_work', 'sale', 'cancel', 'trash'];

    const initialPostbacks = () => {
        const map = {};
        (postbacks || []).forEach((pb) => {
            map[pb.event] = { event: pb.event, url: pb.url, is_active: pb.is_active };
        });
        defaultEvents.forEach((ev) => {
            if (!map[ev]) {
                map[ev] = { event: ev, url: '', is_active: ev === 'in_work' ? false : true };
            }
        });
        return Object.values(map);
    };

    const pbForm = useForm({
        postbacks: initialPostbacks(),
    });

    const searchForm = useForm({
        search: filters?.search ?? '',
        event: filters?.event ?? '',
        result: filters?.result ?? '',
    });

    const regenerate = () => {
        post(route('webmaster.tools.regenerate'));
    };

    const savePostbacks = (e) => {
        e.preventDefault();
        pbForm.post(route('webmaster.tools.postbacks'));
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text);
        }
    };

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(
            route('webmaster.tools.index'),
            { search: searchForm.data.search, event: searchForm.data.event, result: searchForm.data.result },
            { preserveScroll: true, preserveState: true },
        );
    };

    const resetSearch = () => {
        searchForm.setData(() => ({ search: '', event: '', result: '' }));
        router.get(
            route('webmaster.tools.index'),
            { search: '', event: '', result: '' },
            { preserveScroll: true, preserveState: true },
        );
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Инструменты</h2>}>
            <Head title="Инструменты" />
            <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-4 flex gap-2">
                    <button
                        onClick={() => setTab('api')}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'api' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-700'}`}
                    >
                        API
                    </button>
                    <button
                        onClick={() => setTab('postbacks')}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'postbacks' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-700'}`}
                    >
                        Вебхуки
                    </button>
                    <button
                        onClick={() => setTab('smartlinks')}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'smartlinks' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-700'}`}
                    >
                        SmartLinks
                    </button>
                </div>

                {tab === 'api' && (
                    <div className="space-y-4 text-sm text-gray-800">
                        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                            <div className="font-semibold text-indigo-900">Как работать с API</div>
                            <ul className="mt-2 list-disc space-y-1 pl-4">
                                <li>Отправляйте лиды на эндпоинт ниже в формате JSON.</li>
                                <li>Используйте заголовок <code className="font-mono">X-API-KEY</code> со своим ключом.</li>
                                <li>Обязательные поля: <code className="font-mono">offer_id</code>, <code className="font-mono">geo</code>, <code className="font-mono">customer_name</code>, <code className="font-mono">customer_phone</code>.</li>
                                <li>Можно передавать UTM-метки, subid, landing_url и произвольные теги.</li>
                            </ul>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] uppercase text-gray-500">API ключ</div>
                                        <div className="font-mono break-all text-sm">
                                            {showKey ? apiKey.key : `${apiKey.key.slice(0, 8)}••••••${apiKey.key.slice(-4)}`}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="rounded border px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            {showKey ? 'Скрыть' : 'Показать'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(apiKey.key)}
                                            className="rounded border px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            Копировать
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={regenerate}
                                    type="button"
                                    className="w-full rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                >
                                    Пересоздать ключ
                                </button>
                            </div>

                            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                                <div className="text-[11px] uppercase text-gray-500">Эндпоинт</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        className="w-full rounded border px-3 py-2 font-mono text-xs"
                                        value="POST https://cpa.boostclicks.ru/api/leads"
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard('https://cpa.boostclicks.ru/api/leads')}
                                        className="rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Копировать
                                    </button>
                                </div>
                                <div className="text-[11px] uppercase text-gray-500">Заголовок</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        className="w-full rounded border px-3 py-2 font-mono text-xs"
                                        value={`X-API-KEY: ${apiKey.key}`}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(`X-API-KEY: ${apiKey.key}`)}
                                        className="rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Копировать
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[11px] uppercase text-gray-500">Тело запроса (JSON)</div>
                            <pre className="whitespace-pre-wrap break-all rounded bg-white p-3 text-xs text-gray-800">
{`{
  "offer_id": 1,
  "geo": "RU",
  "customer_name": "Имя",
  "customer_phone": "+79990000000",
  "customer_email": "test@example.com",
  "subid": "click123",
  "landing_url": "https://example.com/landing",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "cmp",
  "utm_term": "kw",
  "utm_content": "ad1",
  "tags": {"adset_id": "123", "ad_id": "456"}
}`}
                            </pre>
                        </div>

                        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[11px] uppercase text-gray-500">PHP пример (api.php)</div>
                            <pre className="whitespace-pre-wrap break-all rounded bg-white p-3 text-xs text-gray-800">
{`<?php
// api.php
$data = json_decode(file_get_contents('php://input'), true);
$offerId = $data['offer_id'] ?? null;
$geo = $data['geo'] ?? null;
$name = $data['customer_name'] ?? null;
$phone = $data['customer_phone'] ?? null;

// Сохраняете или обрабатываете одноразовый запрос...

http_response_code(200);
echo json_encode(['status' => 'ok', 'lead_id' => 123]);
`}
                            </pre>
                        </div>
                    </div>
                )}

                {tab === 'postbacks' && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                            <div className="font-semibold text-indigo-900">Как работают вебхуки</div>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <ul className="list-disc space-y-1 pl-4">
                                    <li>Отправляем запрос после создания лида и при смене статуса.</li>
                                    <li>События: <strong>{defaultEvents.join(', ')}</strong>.</li>
                                    <li>Включите только нужные статусы и URL.</li>
                                </ul>
                                <ul className="list-disc space-y-1 pl-4">
                                    <li>Макросы: <code>{'{lead_id}'}</code>, <code>{'{status}'}</code>, <code>{'{from}'}</code>, <code>{'{payout}'}</code>, <code>{'{subid}'}</code>, <code>{'{geo}'}</code>, <code>{'{offer_id}'}</code>, <code>{'{offer_name}'}</code>, <code>{'{landing_url}'}</code>.</li>
                                    <li>Пример: <code>https://tracker.com/postback?subid={'{subid}'}&status={'{status}'}&payout={'{payout}'}&lead={'{lead_id}'}</code></li>
                                </ul>
                            </div>
                        </div>

                        <form onSubmit={savePostbacks} className="space-y-2">
                            <div className="grid gap-2 md:grid-cols-2">
                                {pbForm.data.postbacks.map((pb, idx) => (
                                    <div
                                        key={pb.event}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold uppercase text-gray-600">{pb.event}</div>
                                            <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={pb.is_active}
                                                    onChange={(e) =>
                                                        pbForm.setData('postbacks', [
                                                            ...pbForm.data.postbacks.slice(0, idx),
                                                            { ...pb, is_active: e.target.checked },
                                                            ...pbForm.data.postbacks.slice(idx + 1),
                                                        ])
                                                    }
                                                />
                                                Активен
                                            </label>
                                        </div>
                                        <input
                                            className="mt-2 h-10 w-full rounded border px-3 text-sm"
                                            value={pb.url}
                                            onChange={(e) =>
                                                pbForm.setData('postbacks', [
                                                    ...pbForm.data.postbacks.slice(0, idx),
                                                    { ...pb, url: e.target.value },
                                                    ...pbForm.data.postbacks.slice(idx + 1),
                                                ])
                                            }
                                            placeholder="https://tracker.com/postback"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="submit"
                                    className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Сохранить вебхуки
                                </button>
                                <span className="text-xs text-gray-500">Изменения применяются ко всем событиям выше.</span>
                            </div>
                        </form>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-gray-700">
                            <div className="font-semibold">Пример отправки</div>
                            <div className="mt-1">GET или POST {`<ваш URL>`} (form-data):</div>
                            <ul className="mt-1 list-disc pl-4">
                                <li>lead_id</li>
                                <li>status</li>
                                <li>payout</li>
                                <li>offer_id</li>
                                <li>subid</li>
                                <li>geo</li>
                            </ul>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-800">Лог вебхуков (последние 10 дней)</h3>
                            <form onSubmit={submitSearch} className="mt-2 grid gap-2 text-sm md:grid-cols-4">
                                <div className="md:col-span-2">
                                    <input
                                        className="w-full rounded border px-3 py-2"
                                        placeholder="Поиск по URL, событию, статусу или Lead ID"
                                        value={searchForm.data.search}
                                        onChange={(e) => searchForm.setData('search', e.target.value)}
                                    />
                                </div>
                                <select
                                    className="rounded border px-3 py-2"
                                    value={searchForm.data.event}
                                    onChange={(e) => searchForm.setData('event', e.target.value)}
                                >
                                    <option value="">Все события</option>
                                    {defaultEvents.map((ev) => (
                                        <option key={ev} value={ev}>
                                            {ev}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="rounded border px-3 py-2"
                                    value={searchForm.data.result}
                                    onChange={(e) => searchForm.setData('result', e.target.value)}
                                >
                                    <option value="">Любой результат</option>
                                    <option value="ok">Успешно</option>
                                    <option value="error">С ошибкой</option>
                                </select>
                                <div className="flex gap-2 md:col-span-4">
                                    <button
                                        type="submit"
                                        className="rounded bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700"
                                    >
                                        Применить
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetSearch}
                                        className="rounded border px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Сбросить
                                    </button>
                                </div>
                            </form>
                            <div className="mt-3 overflow-x-auto rounded border hidden md:block">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
                                        <tr>
                                            <th className="px-3 py-2">Дата</th>
                                            <th className="px-3 py-2">Событие</th>
                                            <th className="px-3 py-2">Lead ID</th>
                                            <th className="px-3 py-2">HTTP</th>
                                            <th className="px-3 py-2">URL</th>
                                            <th className="px-3 py-2">Результат</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {logs?.data?.map((log) => (
                                            <tr key={log.id} className="text-gray-700">
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                                    {formatDate(log.created_at)}
                                                </td>
                                                <td className="px-3 py-2">{log.event}</td>
                                                <td className="px-3 py-2">{log.lead_id ?? '—'}</td>
                                                <td className="px-3 py-2">{log.status_code ?? '—'}</td>
                                                <td className="px-3 py-2 break-all text-xs text-gray-700">{log.url}</td>
                                                <td className="px-3 py-2">
                                                    {log.error_message
                                                        ? <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Ошибка</span>
                                                        : <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">OK</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {(logs?.data?.length ?? 0) === 0 && (
                                            <tr>
                                                <td className="px-3 py-4 text-center text-xs text-gray-500" colSpan={6}>
                                                    Нет записей
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 space-y-2 md:hidden">
                                {logs?.data?.map((log) => (
                                    <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm text-sm text-gray-700">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{formatDate(log.created_at)}</span>
                                            <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-gray-700">{log.status_code ?? '—'}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">{log.event} • Lead ID: {log.lead_id ?? '—'}</div>
                                        <div className="mt-1 break-all text-xs text-gray-700">{log.url}</div>
                                        <div className="mt-2">
                                            {log.error_message
                                                ? <span className="rounded bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">Ошибка</span>
                                                : <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">OK</span>}
                                        </div>
                                    </div>
                                ))}
                                {(logs?.data?.length ?? 0) === 0 && (
                                    <div className="rounded-lg border bg-white p-3 text-center text-xs text-gray-500">Нет записей</div>
                                )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {logs?.links?.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                        className={`rounded px-3 py-1 font-semibold ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                                    >
                                        {link.label?.replace(/&laquo;|&raquo;/g, '').trim() || idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'smartlinks' && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                            <div className="font-semibold">SmartLinks: что это и зачем</div>
                            <ul className="mt-2 list-disc space-y-1 pl-4">
                                <li>Одна ссылка может автоматически направлять трафик на разные офферы/лендинги по правилам.</li>
                                <li>Это удобно для сплитов A/B, ротации, fallback-маршрутов и быстрой замены оффера без изменения ссылок в рекламе.</li>
                                <li>В статистике сохраняется <code>click_id</code>, поэтому проще связывать клик и лид.</li>
                            </ul>
                        </div>

                        {smartLinks.length === 0 ? (
                            <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
                                Для вас пока нет доступных SmartLinks. Обратитесь к администратору ПП.
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {smartLinks.map((smartLink) => {
                                    const baseUrl = smartLink.url;
                                    const exampleUrl = `${baseUrl}?subid={subid}&utm_source={source}&utm_campaign={campaign}`;

                                    return (
                                        <div key={smartLink.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                            <div>
                                                <div className="font-semibold text-gray-900">{smartLink.name}</div>
                                                <div className="text-xs text-gray-500">slug: {smartLink.slug}</div>
                                                <div className="text-xs text-gray-500">Активных потоков: {smartLink.streams_count}</div>
                                                <div className="text-xs text-gray-500">Доступ: {smartLink.is_public ? 'публичный' : 'приватный'}</div>
                                                <div className="text-xs text-gray-500">Клики: {smartLink.clicks_count ?? 0}</div>
                                                <div className="text-xs text-gray-500">Конверсии: {smartLink.conversions_count ?? 0}</div>
                                            </div>

                                            <div className="mt-3 space-y-2">
                                                <div className="text-[11px] uppercase text-gray-500">Базовая ссылка</div>
                                                <div className="flex items-center gap-2">
                                                    <input className="w-full rounded border px-3 py-2 font-mono text-xs" value={baseUrl} readOnly />
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(baseUrl)}
                                                        className="rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Копировать
                                                    </button>
                                                </div>

                                                <div className="text-[11px] uppercase text-gray-500">Пример с subid/utm</div>
                                                <div className="flex items-center gap-2">
                                                    <input className="w-full rounded border px-3 py-2 font-mono text-xs" value={exampleUrl} readOnly />
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(exampleUrl)}
                                                        className="rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Копировать
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
