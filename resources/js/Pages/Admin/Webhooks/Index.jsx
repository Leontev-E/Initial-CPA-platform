import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const statuses = [
    { value: 'new', label: 'Новый' },
    { value: 'in_work', label: 'В работе' },
    { value: 'sale', label: 'Продажа' },
    { value: 'cancel', label: 'Отмена' },
    { value: 'trash', label: 'Треш' },
];

const fieldOptions = [
    { value: 'customer_name', label: 'Имя' },
    { value: 'customer_phone', label: 'Телефон' },
    { value: 'customer_email', label: 'Email' },
    { value: 'geo', label: 'GEO' },
    { value: 'payout', label: 'Payout' },
    { value: 'subid', label: 'SubID' },
    { value: 'landing_url', label: 'Landing URL' },
    { value: 'utm_source', label: 'UTM Source' },
    { value: 'utm_medium', label: 'UTM Medium' },
    { value: 'utm_campaign', label: 'UTM Campaign' },
    { value: 'utm_term', label: 'UTM Term' },
    { value: 'utm_content', label: 'UTM Content' },
    { value: 'tags', label: 'Tags' },
    { value: 'extra_data', label: 'Extra data' },
    { value: 'shipping_address', label: 'Адрес доставки' },
];

export default function Index({ webhooks, logs = null, webhookOptions = [], filters = {}, incoming = {} }) {
    const createForm = useForm({
        name: '',
        url: '',
        method: 'post',
        statuses: [],
        fields: [],
        is_active: true,
    });

    const filterForm = useForm({
        search: filters?.search ?? '',
        event: filters?.event ?? '',
        result: filters?.result ?? '',
        webhook_id: filters?.webhook_id ?? '',
    });

    const incomingFilterForm = useForm({
        incoming_search: incoming?.filters?.search ?? '',
        incoming_result: incoming?.filters?.result ?? '',
        incoming_lead_id: incoming?.filters?.lead_id ?? '',
    });

    const initialTab = useMemo(() => {
        if (typeof window === 'undefined') return 'outgoing';
        const urlTab = new URL(window.location.href).searchParams.get('tab');
        return urlTab === 'incoming' ? 'incoming' : 'outgoing';
    }, []);

    const [activeTab, setActiveTab] = useState(initialTab);
    const [showToken, setShowToken] = useState(false);

    const setTab = (tab) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        createForm.post(route('admin.webhooks.store'), {
            onSuccess: () => createForm.reset('name', 'url', 'statuses', 'fields', 'is_active'),
        });
    };

    const submitFilters = (e) => {
        e.preventDefault();
        router.get(
            route('admin.webhooks.index'),
            {
                search: filterForm.data.search,
                event: filterForm.data.event,
                result: filterForm.data.result,
                webhook_id: filterForm.data.webhook_id,
                tab: 'outgoing',
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const resetFilters = () => {
        filterForm.setData({ search: '', event: '', result: '', webhook_id: '' });
        router.get(
            route('admin.webhooks.index'),
            { search: '', event: '', result: '', webhook_id: '', tab: 'outgoing' },
            { preserveScroll: true, preserveState: true },
        );
    };

    const submitIncomingFilters = (e) => {
        e.preventDefault();
        router.get(
            route('admin.webhooks.index'),
            {
                incoming_search: incomingFilterForm.data.incoming_search,
                incoming_result: incomingFilterForm.data.incoming_result,
                incoming_lead_id: incomingFilterForm.data.incoming_lead_id,
                tab: 'incoming',
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const resetIncomingFilters = () => {
        incomingFilterForm.setData({ incoming_search: '', incoming_result: '', incoming_lead_id: '' });
        router.get(
            route('admin.webhooks.index'),
            {
                incoming_search: '',
                incoming_result: '',
                incoming_lead_id: '',
                tab: 'incoming',
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const copyToClipboard = (text) => {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text);
        }
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
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Вебхуки</h2>}>
            <Head title="Вебхуки" />

            <div className="mb-4 flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
                <button
                    type="button"
                    onClick={() => setTab('outgoing')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                        activeTab === 'outgoing' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'
                    }`}
                >
                    Исходящие вебхуки
                </button>
                <button
                    type="button"
                    onClick={() => setTab('incoming')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                        activeTab === 'incoming' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'
                    }`}
                >
                    Входящие вебхуки
                </button>
            </div>

            {activeTab === 'outgoing' && (
                <OutgoingSection
                    createForm={createForm}
                    submit={submit}
                    webhooks={webhooks}
                    filterForm={filterForm}
                    submitFilters={submitFilters}
                    resetFilters={resetFilters}
                    webhookOptions={webhookOptions}
                    logs={logs}
                    router={router}
                    formatDate={formatDate}
                />
            )}

            {activeTab === 'incoming' && (
                <IncomingSection
                    incoming={incoming}
                    incomingFilterForm={incomingFilterForm}
                    submitIncomingFilters={submitIncomingFilters}
                    resetIncomingFilters={resetIncomingFilters}
                    router={router}
                    formatDate={formatDate}
                    showToken={showToken}
                    setShowToken={setShowToken}
                    copyToClipboard={copyToClipboard}
                />
            )}
        </AuthenticatedLayout>
    );
}

function OutgoingSection({
    createForm,
    submit,
    webhooks,
    filterForm,
    submitFilters,
    resetFilters,
    webhookOptions,
    logs,
    router,
    formatDate,
}) {
    return (
        <>
            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm text-sm text-gray-700">
                <div className="text-sm font-semibold text-gray-800">Документация по исходящим вебхукам</div>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>Отправляем вебхук после создания лида и при смене статуса.</li>
                    <li>Метод: выберите GET (макросы в URL + query) или POST (form-data).</li>
                    <li>Если статусы не выбраны — отправляем по всем статусам.</li>
                    <li>Макросы: можно использовать в URL/запросе: {`{id}`}, {`{status}`}, {`{from}`}, {`{from_status}`}, {`{offer_id}`}, {`{offer_name}`}, {`{webmaster_id}`}, {`{created_at}`}, {`{customer_name}`}, {`{customer_phone}`}, {`{customer_email}`}, {`{geo}`}, {`{payout}`}, {`{subid}`}, {`{landing_url}`}, {`{utm_source}`}, {`{utm_medium}`}, {`{utm_campaign}`}, {`{utm_term}`}, {`{utm_content}`}, {`{tags}`}, {`{extra_data}`}, {`{shipping_address}`}</li>
                    <li>Пример GET: <code>https://example.com/hook?subid=&#123;subid&#125;&status=&#123;status&#125;&phone=&#123;customer_phone&#125;</code></li>
                    <li>Пример POST (form-data): поля по выбранным чекбоксам + базовые поля.</li>
                    <li>Таймаут отправки: 10 секунд. Ответ не влияет на статусы в системе.</li>
                </ul>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">Новый вебхук</h3>
                    <form onSubmit={submit} className="mt-3 space-y-3">
                        <input
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                            placeholder="Название"
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                        />
                        <div className="grid gap-2 md:grid-cols-2">
                            <input
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                placeholder="https://..."
                                value={createForm.data.url}
                                onChange={(e) => createForm.setData('url', e.target.value)}
                            />
                            <select
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                value={createForm.data.method}
                                onChange={(e) => createForm.setData('method', e.target.value)}
                            >
                                <option value="post">POST</option>
                                <option value="get">GET</option>
                            </select>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-600">Статусы (пусто = все)</div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                {statuses.map((s) => (
                                    <label key={s.value} className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={createForm.data.statuses.includes(s.value)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                createForm.setData(
                                                    'statuses',
                                                    checked
                                                        ? [...createForm.data.statuses, s.value]
                                                        : createForm.data.statuses.filter((v) => v !== s.value),
                                                );
                                            }}
                                        />
                                        <span>{s.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-600">Доп. поля (пусто = все)</div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                {fieldOptions.map((f) => (
                                    <label key={f.value} className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={createForm.data.fields.includes(f.value)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                createForm.setData(
                                                    'fields',
                                                    checked
                                                        ? [...createForm.data.fields, f.value]
                                                        : createForm.data.fields.filter((v) => v !== f.value),
                                                );
                                            }}
                                        />
                                        <span>{f.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={createForm.data.is_active}
                                onChange={(e) => createForm.setData('is_active', e.target.checked)}
                            />
                            Активен
                        </label>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Сохранить
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">Список вебхуков</h3>
                    <div className="mt-3 divide-y">
                        {webhooks.map((hook) => (
                            <WebhookRow key={hook.id} hook={hook} />
                        ))}
                        {webhooks.length === 0 && (
                            <div className="py-6 text-center text-sm text-gray-500">Вебхуки не настроены</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Лог исходящих вебхуков (последние 10 дней)</h3>
                </div>
                <form onSubmit={submitFilters} className="mt-3 grid gap-2 text-sm md:grid-cols-5">
                    <div className="md:col-span-2">
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Поиск по URL, событию, HTTP или Lead ID"
                            value={filterForm.data.search}
                            onChange={(e) => filterForm.setData('search', e.target.value)}
                        />
                    </div>
                    <select
                        className="rounded border px-3 py-2"
                        value={filterForm.data.webhook_id}
                        onChange={(e) => filterForm.setData('webhook_id', e.target.value)}
                    >
                        <option value="">Все вебхуки</option>
                        {webhookOptions.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="rounded border px-3 py-2"
                        value={filterForm.data.event}
                        onChange={(e) => filterForm.setData('event', e.target.value)}
                    >
                        <option value="">Все события</option>
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className="rounded border px-3 py-2"
                        value={filterForm.data.result}
                        onChange={(e) => filterForm.setData('result', e.target.value)}
                    >
                        <option value="">Любой результат</option>
                        <option value="ok">Успешно</option>
                        <option value="error">С ошибкой</option>
                    </select>
                    <div className="flex gap-2 md:col-span-5">
                        <button
                            type="submit"
                            className="rounded bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700"
                        >
                            Применить
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="rounded border px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Сбросить
                        </button>
                    </div>
                </form>

                <div className="mt-3 overflow-x-auto rounded border">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
                            <tr>
                                <th className="px-3 py-2">Дата</th>
                                <th className="px-3 py-2">Вебхук</th>
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
                                    <td className="px-3 py-2">{log.webhook?.name || '—'}</td>
                                    <td className="px-3 py-2">{log.event}</td>
                                    <td className="px-3 py-2">{log.lead_id ?? '—'}</td>
                                    <td className="px-3 py-2">{log.status_code ?? '—'}</td>
                                    <td className="px-3 py-2 break-all text-xs text-gray-700">{log.url}</td>
                                    <td className="px-3 py-2">
                                        {log.error_message ? (
                                            <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                                Ошибка
                                            </span>
                                        ) : (
                                            <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                                OK
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(logs?.data?.length ?? 0) === 0 && (
                                <tr>
                                    <td className="px-3 py-4 text-center text-xs text-gray-500" colSpan={7}>
                                        Нет записей
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {logs?.links?.map((link, idx) => (
                        <button
                            key={idx}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                            className={`rounded px-3 py-1 font-semibold ${
                                link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'
                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                        >
                            {link.label?.replace(/&laquo;|&raquo;/g, '').trim() || idx + 1}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

function IncomingSection({
    incoming,
    incomingFilterForm,
    submitIncomingFilters,
    resetIncomingFilters,
    router,
    formatDate,
    showToken,
    setShowToken,
    copyToClipboard,
}) {
    const incomingUrl = incoming?.url || '';
    const incomingToken = incoming?.token || '';

    const augmentUrl = (url) => {
        if (!url) return null;
        const u = new URL(url, window.location.origin);
        u.searchParams.set('tab', 'incoming');
        return u.toString();
    };

    return (
        <>
            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm text-sm text-gray-700">
                <div className="text-sm font-semibold text-gray-800">Входящие вебхуки</div>
                <div className="mt-2 space-y-2 text-gray-700">
                    <p>Через эту секцию можно обновлять статусы лидов из внешних CRM и колл-центров.</p>
                    <ul className="list-disc space-y-1 pl-4">
                        <li>Метод: POST, формат: JSON.</li>
                        <li>Обязательные поля: <code>lead_id</code>, <code>status</code> (new, in_work, sale, cancel, trash).</li>
                        <li>Опционально: <code>comment</code> — комментарий оператора, <code>source</code> — источник события.</li>
                        <li>Авторизация: заголовок <code>X-Webhook-Token</code> или параметр <code>token</code>.</li>
                    </ul>
                    <div className="rounded border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
                        <div className="font-semibold">Пример запроса (curl)</div>
                        <pre className="mt-2 whitespace-pre-wrap break-all">
{`curl -X POST "${incomingUrl || 'https://cpa.boostclicks.ru/api/webhooks/leads/status'}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Token: ${incomingToken || '<ВАШ_ТОКЕН>'}" \\
  -d '{
    "lead_id": 123,
    "status": "sale",
    "comment": "Подтверждён колл-центром"
  }'`}
                        </pre>
                        <div className="mt-2 text-gray-700">Успешный ответ: {"{ success: true, lead_id, old_status, new_status }"}</div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-gray-800">Настройки входящего вебхука</div>
                        <div className="text-xs text-gray-500">URL и токен для вашей CRM</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post(route('admin.webhooks.incoming.token'), { tab: 'incoming' }, { preserveScroll: true, preserveState: true })}
                        className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Сгенерировать новый токен
                    </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <div className="text-[11px] uppercase text-gray-500">URL</div>
                        <div className="flex items-center gap-2">
                            <input
                                className="w-full rounded border px-3 py-2 text-sm"
                                value={incomingUrl}
                                readOnly
                            />
                            <button
                                type="button"
                                onClick={() => incomingUrl && copyToClipboard(incomingUrl)}
                                className="rounded border px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Копировать
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] uppercase text-gray-500">Секретный токен</div>
                        <div className="flex items-center gap-2">
                            <input
                                className="w-full rounded border px-3 py-2 text-sm"
                                type={showToken ? 'text' : 'password'}
                                value={incomingToken}
                                readOnly
                            />
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="rounded border px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                {showToken ? 'Скрыть' : 'Показать'}
                            </button>
                            <button
                                type="button"
                                onClick={() => incomingToken && copyToClipboard(incomingToken)}
                                className="rounded border px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Копировать
                            </button>
                        </div>
                        {!incomingToken && (
                            <div className="text-xs text-amber-600">Токен пока не создан. Нажмите «Сгенерировать новый токен».</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Лог входящих вебхуков (последние 10 дней)</h3>
                </div>

                <form onSubmit={submitIncomingFilters} className="mt-3 grid gap-2 text-sm md:grid-cols-5">
                    <div className="md:col-span-2">
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Поиск по URL, payload или статусу"
                            value={incomingFilterForm.data.incoming_search}
                            onChange={(e) => incomingFilterForm.setData('incoming_search', e.target.value)}
                        />
                    </div>
                    <input
                        className="rounded border px-3 py-2"
                        placeholder="Lead ID"
                        value={incomingFilterForm.data.incoming_lead_id}
                        onChange={(e) => incomingFilterForm.setData('incoming_lead_id', e.target.value)}
                    />
                    <select
                        className="rounded border px-3 py-2"
                        value={incomingFilterForm.data.incoming_result}
                        onChange={(e) => incomingFilterForm.setData('incoming_result', e.target.value)}
                    >
                        <option value="">Любой результат</option>
                        <option value="ok">Успешно</option>
                        <option value="error">С ошибкой</option>
                    </select>
                    <div className="flex gap-2 md:col-span-5">
                        <button
                            type="submit"
                            className="rounded bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700"
                        >
                            Применить
                        </button>
                        <button
                            type="button"
                            onClick={resetIncomingFilters}
                            className="rounded border px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Сбросить
                        </button>
                    </div>
                </form>

                <div className="mt-3 overflow-x-auto rounded border">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
                            <tr>
                                <th className="px-3 py-2">Дата</th>
                                <th className="px-3 py-2">Lead ID</th>
                                <th className="px-3 py-2">Статус до</th>
                                <th className="px-3 py-2">Статус после</th>
                                <th className="px-3 py-2">IP</th>
                                <th className="px-3 py-2">Результат</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {incoming?.logs?.data?.map((log) => (
                                <tr key={log.id} className="text-gray-700">
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="px-3 py-2">{log.lead_id ?? '—'}</td>
                                    <td className="px-3 py-2">{log.status_before ?? '—'}</td>
                                    <td className="px-3 py-2">{log.status_after ?? '—'}</td>
                                    <td className="px-3 py-2">{log.ip ?? '—'}</td>
                                    <td className="px-3 py-2">
                                        {log.error_message ? (
                                            <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                                Ошибка
                                            </span>
                                        ) : (
                                            <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                                OK
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(incoming?.logs?.data?.length ?? 0) === 0 && (
                                <tr>
                                    <td className="px-3 py-4 text-center text-xs text-gray-500" colSpan={6}>
                                        Нет записей
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {incoming?.logs?.links?.map((link, idx) => (
                        <button
                            key={idx}
                            disabled={!link.url}
                            onClick={() => {
                                const url = augmentUrl(link.url);
                                if (url) {
                                    router.visit(url, { preserveScroll: true, preserveState: true });
                                }
                            }}
                            className={`rounded px-3 py-1 font-semibold ${
                                link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'
                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                        >
                            {link.label?.replace(/&laquo;|&raquo;/g, '').trim() || idx + 1}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

function WebhookRow({ hook }) {
    const form = useForm({
        name: hook.name,
        url: hook.url,
        method: hook.method || 'post',
        statuses: hook.statuses || [],
        fields: hook.fields || [],
        is_active: hook.is_active,
        _method: 'patch',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('admin.webhooks.update', hook.id));
    };

    return (
        <form onSubmit={submit} className="space-y-2 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                    <input
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                    <input
                        className="mt-2 w-full rounded border px-3 py-2 text-sm"
                        value={form.data.url}
                        onChange={(e) => form.setData('url', e.target.value)}
                    />
                    <select
                        className="mt-2 w-full rounded border px-3 py-2 text-sm"
                        value={form.data.method}
                        onChange={(e) => form.setData('method', e.target.value)}
                    >
                        <option value="post">POST</option>
                        <option value="get">GET</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                        />
                        Активен
                    </label>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                        Обновить
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('Удалить вебхук?')) {
                                form.delete(route('admin.webhooks.destroy', hook.id));
                            }
                        }}
                        className="rounded bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                        Удалить
                    </button>
                </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
                <div>
                    <div className="text-xs font-semibold text-gray-600">Статусы</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {statuses.map((s) => (
                            <label key={s.value} className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <input
                                    type="checkbox"
                                    checked={form.data.statuses.includes(s.value)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        form.setData(
                                            'statuses',
                                            checked
                                                ? [...form.data.statuses, s.value]
                                                : form.data.statuses.filter((v) => v !== s.value),
                                        );
                                    }}
                                />
                                <span>{s.label}</span>
                            </label>
                        ))}
                        {form.data.statuses.length === 0 && <span className="text-gray-500">Все</span>}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-semibold text-gray-600">Доп. поля</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {fieldOptions.map((f) => (
                            <label key={f.value} className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <input
                                    type="checkbox"
                                    checked={form.data.fields.includes(f.value)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        form.setData(
                                            'fields',
                                            checked
                                                ? [...form.data.fields, f.value]
                                                : form.data.fields.filter((v) => v !== f.value),
                                        );
                                    }}
                                />
                                <span>{f.label}</span>
                            </label>
                        ))}
                        {form.data.fields.length === 0 && <span className="text-gray-500">Все</span>}
                    </div>
                </div>
            </div>
        </form>
    );
}
