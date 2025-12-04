import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

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
];

export default function Index({ webhooks }) {
    const createForm = useForm({
        name: '',
        url: '',
        method: 'post',
        statuses: [],
        fields: [],
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        createForm.post(route('admin.webhooks.store'), {
            onSuccess: () => createForm.reset('name', 'url', 'statuses', 'fields', 'is_active'),
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Вебхуки лидов</h2>}>
            <Head title="Вебхуки лидов" />
            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm text-sm text-gray-700">
                <div className="text-sm font-semibold text-gray-800">Документация</div>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>Отправляем вебхук после создания лида и при смене статуса.</li>
                    <li>Метод: выберите GET (макросы в URL + query) или POST (form-data).</li>
                    <li>Если статусы не выбраны — отправляем по всем статусам.</li>
                    <li>Макросы: можно использовать в URL/запросе: {`{id}`}, {`{status}`}, {`{offer_id}`}, {`{offer_name}`}, {`{webmaster_id}`}, {`{created_at}`}, {`{customer_name}`}, {`{customer_phone}`}, {`{customer_email}`}, {`{geo}`}, {`{payout}`}, {`{subid}`}, {`{landing_url}`}, {`{utm_source}`}, {`{utm_medium}`}, {`{utm_campaign}`}, {`{utm_term}`}, {`{utm_content}`}, {`{tags}`}, {`{extra_data}`}</li>
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
        </AuthenticatedLayout>
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
