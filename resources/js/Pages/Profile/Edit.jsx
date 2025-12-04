import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useEffect, useState } from 'react';

export default function Edit({ mustVerifyEmail, status, employees = [] }) {
    const { flash } = usePage().props;
    const defaultByRole = {
        admin: {
            sections: ['categories', 'offers', 'leads', 'webmasters', 'payouts', 'reports'],
            actions: { create: true, update: true, delete: true, impersonate: true, impersonate_employee: true },
        },
        tech: {
            sections: ['offers', 'leads', 'reports'],
            actions: { create: true, update: true, delete: false, impersonate: false, impersonate_employee: false },
        },
        accounting: {
            sections: ['payouts', 'reports'],
            actions: { create: false, update: true, delete: false, impersonate: false, impersonate_employee: false },
        },
        operator: {
            sections: ['leads'],
            actions: { create: false, update: true, delete: false, impersonate: false, impersonate_employee: false },
        },
    };

    const inviteForm = useForm({
        name: '',
        email: '',
        telegram: '',
        employee_role: 'admin',
        sections: defaultByRole.admin.sections,
        actions: defaultByRole.admin.actions,
    });

    const editForm = useForm({
        id: null,
        name: '',
        email: '',
        telegram: '',
        employee_role: 'admin',
        sections: [],
        actions: {
            create: false,
            update: false,
            delete: false,
            impersonate: false,
            impersonate_employee: false,
        },
    });
    const [editingId, setEditingId] = useState(null);

    const submitInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route('profile.invite'), {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset('name', 'email', 'telegram'),
        });
    };

    const startEdit = (emp) => {
        setEditingId(emp.id);
        editForm.setData({
            id: emp.id,
            name: emp.name ?? '',
            email: emp.email ?? '',
            telegram: emp.telegram ?? '',
            employee_role: emp.employee_role ?? 'admin',
            sections: emp.permissions?.sections ?? [],
            actions: emp.permissions?.actions ?? { create: false, update: false, delete: false, impersonate: false },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        const payload = {
            name: editForm.data.name,
            telegram: editForm.data.telegram,
            employee_role: editForm.data.employee_role,
            sections: editForm.data.sections,
            actions: editForm.data.actions,
        };
        router.patch(route('profile.employees.update', editForm.data.id), payload, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    useEffect(() => {
        const roleDefaults = defaultByRole[inviteForm.data.employee_role] || defaultByRole.admin;
        inviteForm.setData((prev) => ({
            ...prev,
            sections: roleDefaults.sections,
            actions: roleDefaults.actions,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inviteForm.data.employee_role]);

    const sectionLabels = {
        categories: 'Категории',
        offers: 'Офферы',
        leads: 'Лиды',
        webmasters: 'Вебмастера',
        payouts: 'Выплаты',
        reports: 'Аналитика и отчеты',
    };

    const actionLabels = {
        create: 'Создание',
        update: 'Редактирование',
        delete: 'Удаление',
    };

    const roleLabels = {
        admin: 'Админ',
        tech: 'Технический специалист',
        accounting: 'Бухгалтерия',
        operator: 'Оператор',
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `Дата: ${dd}.${mm}.${yyyy} · Время: ${hh}:${min}`;
    };

    const deleteEmployee = (id) => {
        if (!confirm('Удалить сотрудника?')) return;
        router.delete(route('profile.employees.destroy', id));
    };

    const roleSectionDefaults = (role) => defaultByRole[role] || defaultByRole.admin;

    useEffect(() => {
        if (editingId) {
            const defs = roleSectionDefaults(editForm.data.employee_role);
            editForm.setData((prev) => ({
                ...prev,
                sections: defs.sections,
                actions: defs.actions,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editForm.data.employee_role, editingId]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Личный кабинет
                </h2>
            }
        >
            <Head title="Личный кабинет" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Сотрудники партнерской программы
                        </h3>
                        {flash?.success && (
                            <div className="mt-2 flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                                <span className="text-lg">✓</span>
                                <span>{flash.success}</span>
                            </div>
                        )}
                        <form onSubmit={submitInvite} className="mt-3 grid gap-3">
                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    className="w-full rounded border px-3 py-2"
                                    placeholder="Имя сотрудника"
                                    value={inviteForm.data.name}
                                    onChange={(e) => inviteForm.setData('name', e.target.value)}
                                />
                                <input
                                    className="w-full rounded border px-3 py-2"
                                    placeholder="Email"
                                    value={inviteForm.data.email}
                                    onChange={(e) => inviteForm.setData('email', e.target.value)}
                                />
                                <input
                                    className="w-full rounded border px-3 py-2"
                                    placeholder="Telegram"
                                    value={inviteForm.data.telegram}
                                    onChange={(e) => {
                                        const v = e.target.value.startsWith('@')
                                            ? e.target.value
                                            : '@' + e.target.value;
                                        inviteForm.setData('telegram', v);
                                    }}
                                />
                                <select
                                    className="w-full rounded border px-3 py-2"
                                    value={inviteForm.data.employee_role}
                                    onChange={(e) => inviteForm.setData('employee_role', e.target.value)}
                                >
                                    <option value="admin">Админ</option>
                                    <option value="tech">Технический специалист</option>
                                    <option value="accounting">Бухгалтерия</option>
                                    <option value="operator">Оператор</option>
                                </select>
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-700">Доступные разделы</div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                    {['categories','offers','leads','webmasters','payouts','reports'].map((section) => (
                                        <label key={section} className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={inviteForm.data.sections.includes(section)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    inviteForm.setData('sections', checked
                                                        ? [...inviteForm.data.sections, section]
                                                        : inviteForm.data.sections.filter((s) => s !== section));
                                                }}
                                            />
                                            {sectionLabels[section] ?? section}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-700">Действия</div>
                                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                    {['create','update','delete'].map((action) => (
                                        <label key={action} className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={inviteForm.data.actions[action]}
                                                onChange={(e) =>
                                                    inviteForm.setData('actions', {
                                                        ...inviteForm.data.actions,
                                                        [action]: e.target.checked,
                                                    })
                                                }
                                            />
                                            {actionLabels[action] ?? action}
                                        </label>
                                    ))}
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={inviteForm.data.actions.impersonate}
                                            onChange={(e) =>
                                                inviteForm.setData('actions', {
                                                    ...inviteForm.data.actions,
                                                    impersonate: e.target.checked,
                                                })
                                            }
                                        />
                                        Имперсонация вебмастеров
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={inviteForm.data.actions.impersonate_employee}
                                            onChange={(e) =>
                                                inviteForm.setData('actions', {
                                                    ...inviteForm.data.actions,
                                                    impersonate_employee: e.target.checked,
                                                })
                                            }
                                        />
                                        Имперсонация сотрудников
                                    </label>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={inviteForm.processing}
                                className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Пригласить сотрудника
                            </button>
                            {inviteForm.errors.email && (
                                <div className="text-xs text-red-600">{inviteForm.errors.email}</div>
                            )}
                            {inviteForm.errors.telegram && (
                                <div className="text-xs text-red-600">{inviteForm.errors.telegram}</div>
                            )}
                        </form>

                        <div className="mt-6 space-y-2">
                            {employees.length === 0 && (
                                <div className="text-sm text-gray-500">Сотрудников пока нет</div>
                            )}
                            {employees.map((emp) => (
                                <div key={emp.id} className="flex flex-col gap-3 rounded border px-3 py-2 text-sm">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-800">{emp.name}</div>
                                            <div className="text-gray-600">Почта: {emp.email}</div>
                                            <div className="text-gray-600">Telegram: {emp.telegram}</div>
                                            <div className="text-gray-500">Роль: {roleLabels[emp.employee_role] ?? emp.employee_role}</div>
                                            <div className="text-gray-500">
                                                Разделы: {(emp.permissions?.sections || []).map((s) => sectionLabels[s] ?? s).join(', ') || '—'}
                                            </div>
                                            <div className="text-gray-500">
                                                Действия: {Object.entries(emp.permissions?.actions || {}).filter(([,v])=>v).map(([k])=>actionLabels[k] ?? k).join(', ') || '—'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                                            <div>{formatDate(emp.created_at)}</div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => router.post(route('profile.employees.impersonate', emp.id))}
                                                    className="rounded border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
                                                >
                                                    Войти как сотрудник
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(emp)}
                                                    className="rounded border border-indigo-200 px-2 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteEmployee(emp.id)}
                                                    className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {editingId === emp.id && (
                                        <form onSubmit={submitEdit} className="rounded border bg-slate-50 px-3 py-2">
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <input
                                                    className="w-full rounded border px-3 py-2"
                                                    placeholder="Имя сотрудника"
                                                    value={editForm.data.name}
                                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                                />
                                                <input
                                                    className="w-full cursor-not-allowed rounded border bg-slate-100 px-3 py-2 text-gray-500"
                                                    placeholder="Email"
                                                    value={editForm.data.email}
                                                    disabled
                                                    readOnly
                                                />
                                                <input
                                                    className="w-full rounded border px-3 py-2"
                                                    placeholder="Telegram"
                                                    value={editForm.data.telegram}
                                                    onChange={(e) => {
                                                        const v = e.target.value.startsWith('@')
                                                            ? e.target.value
                                                            : '@' + e.target.value;
                                                        editForm.setData('telegram', v);
                                                    }}
                                                />
                                                <select
                                                    className="w-full rounded border px-3 py-2"
                                                    value={editForm.data.employee_role}
                                                    onChange={(e) => editForm.setData('employee_role', e.target.value)}
                                                >
                                                    <option value="admin">Админ</option>
                                                    <option value="tech">Технический специалист</option>
                                                    <option value="accounting">Бухгалтерия</option>
                                                    <option value="operator">Оператор</option>
                                                </select>
                                            </div>
                                            <div className="mt-3">
                                                <div className="text-sm font-semibold text-gray-700">Доступные разделы</div>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                                    {['categories','offers','leads','webmasters','payouts','reports'].map((section) => (
                                                        <label key={section} className="inline-flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={editForm.data.sections.includes(section)}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    editForm.setData('sections', checked
                                                                        ? [...editForm.data.sections, section]
                                                                        : editForm.data.sections.filter((s) => s !== section));
                                                                }}
                                                            />
                                                            {sectionLabels[section] ?? section}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <div className="text-sm font-semibold text-gray-700">Действия</div>
                                                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                    {['create','update','delete'].map((action) => (
                                        <label key={action} className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.data.actions[action]}
                                                                onChange={(e) =>
                                                                    editForm.setData('actions', {
                                                                        ...editForm.data.actions,
                                                                        [action]: e.target.checked,
                                                                    })
                                                                }
                                                            />
                                            {actionLabels[action] ?? action}
                                        </label>
                                    ))}
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editForm.data.actions.impersonate}
                                            onChange={(e) =>
                                                editForm.setData('actions', {
                                                    ...editForm.data.actions,
                                                    impersonate: e.target.checked,
                                                })
                                            }
                                        />
                                        Имперсонация вебмастеров
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editForm.data.actions.impersonate_employee}
                                            onChange={(e) =>
                                                editForm.setData('actions', {
                                                    ...editForm.data.actions,
                                                    impersonate_employee: e.target.checked,
                                                })
                                            }
                                        />
                                        Имперсонация сотрудников
                                    </label>
                                </div>
                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={editForm.processing}
                                                    className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                                >
                                                    Сохранить
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingId(null)}
                                                    className="rounded border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                            {(editForm.errors.email || editForm.errors.telegram) && (
                                                <div className="mt-2 text-xs text-red-600">
                                                    {editForm.errors.email || editForm.errors.telegram}
                                                </div>
                                            )}
                                        </form>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
