import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ apiKey, postbacks, logs, filters, eventOptions = [] }) {
    const [tab, setTab] = useState('api');
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
                        Постбеки
                    </button>
                </div>

                {tab === 'api' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded border px-3 py-2 text-sm text-gray-700">
                            <div>
                                <div className="text-xs uppercase text-gray-500">API ключ</div>
                                <span className="font-mono break-all">{apiKey.key}</span>
                            </div>
                            <button
                                onClick={regenerate}
                                className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
                            >
                                Пересоздать
                            </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="text-xs uppercase text-gray-500">Эндпоинт</div>
                            <div className="font-mono break-all">POST https://openai-book.store/api/leads</div>
                            <div className="text-xs uppercase text-gray-500">Заголовок</div>
                            <div className="font-mono break-all">X-API-KEY: {apiKey.key}</div>
                            <div className="text-xs uppercase text-gray-500">Тело запроса</div>
                            <pre className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-gray-800">
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
                            <div className="text-xs uppercase text-gray-500">PHP пример (api.php)</div>
                            <pre className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-gray-800">
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
                        <div className="rounded bg-slate-50 p-3 text-sm text-gray-700">
                            <div className="font-semibold">Основное</div>
                            <p className="mt-1">
                                Постбек — это запрос после смены статуса лида. Поддерживаемые события: <strong>{defaultEvents.join(', ')}</strong>.
                            </p>
                            <p className="mt-1">
                                Макросы: <code>{'{lead_id}'}</code>, <code>{'{status}'}</code>, <code>{'{from}'}</code>, <code>{'{payout}'}</code>, <code>{'{subid}'}</code>, <code>{'{geo}'}</code>, <code>{'{offer_id}'}</code>, <code>{'{offer_name}'}</code>, <code>{'{landing_url}'}</code>.
                            </p>
                            <p className="mt-1">
                                Пример URL: <code>https://tracker.com/postback?subid={'{subid}'}&status={'{status}'}&payout={'{payout}'}&lead={'{lead_id}'}</code>
                            </p>
                        </div>
                        <form onSubmit={savePostbacks} className="space-y-3">
                            {pbForm.data.postbacks.map((pb, idx) => (
                                <div
                                    key={pb.event}
                                    className="rounded border px-3 py-2 text-sm text-gray-700"
                                >
                                    <div className="font-semibold uppercase text-gray-600">
                                        {pb.event}
                                    </div>
                                    <input
                                        className="mt-2 w-full rounded border px-2 py-1"
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
                                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
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
                            ))}
                            <button
                                type="submit"
                                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Сохранить постбеки
                            </button>
                        </form>
                        <div className="rounded bg-slate-50 p-3 text-xs text-gray-700">
                            <div className="font-semibold">Пример отправки:</div>
                            <div>POST {`<Ваш URL>`} с form-data:</div>
                            <ul className="list-disc pl-4">
                                <li>lead_id</li>
                                <li>status</li>
                                <li>payout</li>
                                <li>offer_id</li>
                                <li>subid</li>
                                <li>geo</li>
                            </ul>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-800">Лог постбеков (последние 10 дней)</h3>
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
        -                                <div className="mt-1 text-xs text-gray-500">{log.event} • Lead ID: {log.lead_id ?? '—'}</div>
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
            </div>
        </AuthenticatedLayout>
    );
}
