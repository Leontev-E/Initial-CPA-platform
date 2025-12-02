import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ apiKey, postbacks }) {
    const [tab, setTab] = useState('api');
    const { post } = useForm({});
    const defaultEvents = ['lead', 'in_work', 'sale', 'cancel', 'trash'];
    const pbForm = useForm({
        postbacks:
            postbacks?.map((pb) => ({
                event: pb.event,
                url: pb.url,
                is_active: pb.is_active,
            })) ?? defaultEvents.map((ev) => ({ event: ev, url: '', is_active: true })),
    });

    const regenerate = () => {
        post(route('webmaster.tools.regenerate'));
    };

    const savePostbacks = (e) => {
        e.preventDefault();
        pbForm.post(route('webmaster.tools.postbacks'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Инструменты</h2>}
        >
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
                                Перегенерировать
                            </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="text-xs uppercase text-gray-500">Эндпоинт</div>
                            <div className="font-mono break-all">POST https://openai-book.store/api/leads</div>
                            <div className="text-xs uppercase text-gray-500">Заголовок</div>
                            <div className="font-mono break-all">X-API-KEY: {apiKey.key}</div>
                            <div className="text-xs uppercase text-gray-500">Пример тела</div>
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

// Сохраните лид в своей системе...

http_response_code(200);
echo json_encode(['status' => 'ok', 'lead_id' => 123]);
`}
                            </pre>
                        </div>
                    </div>
                )}

                {tab === 'postbacks' && (
                    <div>
                        <p className="text-sm text-gray-700">
                            Укажите URL для событий. Мы подставляем макросы: <code>{'{lead_id}'}</code>, <code>{'{status}'}</code>, <code>{'{payout}'}</code>, <code>{'{subid}'}</code>, <code>{'{geo}'}</code>.
                        </p>
                        <form onSubmit={savePostbacks} className="mt-3 space-y-3">
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
                                        placeholder="https://..."
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
                                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Сохранить постбеки
                            </button>
                        </form>
                        <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-gray-700">
                            <div className="font-semibold">Пример отправки:</div>
                            <div>POST {`<ваш URL>`} с form-data:</div>
                            <ul className="list-disc pl-4">
                                <li>lead_id</li>
                                <li>status</li>
                                <li>payout</li>
                                <li>offer_id</li>
                                <li>subid</li>
                                <li>geo</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
