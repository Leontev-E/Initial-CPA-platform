import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useEffect } from 'react';

export default function Edit({ mustVerifyEmail, status, employees = [] }) {
    const { flash } = usePage().props;
    const defaultByRole = {
        admin: {
            sections: ['categories', 'offers', 'leads', 'webmasters', 'payouts', 'reports'],
            actions: { create: true, update: true, delete: true },
        },
        tech: {
            sections: ['offers', 'leads', 'reports'],
            actions: { create: true, update: true, delete: false },
        },
        accounting: {
            sections: ['payouts', 'reports'],
            actions: { create: false, update: true, delete: false },
        },
        operator: {
            sections: ['leads'],
            actions: { create: false, update: true, delete: false },
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

    const submitInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route('profile.invite'), {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset('name', 'email', 'telegram'),
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
                            <div className="mt-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                                {flash.success}
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
                                <div key={emp.id} className="flex items-start justify-between rounded border px-3 py-2 text-sm">
                                    <div>
                                        <div className="font-semibold text-gray-800">{emp.name}</div>
                                        <div className="text-gray-600">{emp.email} • {emp.telegram}</div>
                                        <div className="text-gray-500">Роль: {emp.employee_role}</div>
                                        <div className="text-gray-500">
                                            Разделы: {(emp.permissions?.sections || []).map((s) => sectionLabels[s] ?? s).join(', ') || '—'}
                                        </div>
                                        <div className="text-gray-500">
                                            Действия: {Object.entries(emp.permissions?.actions || {}).filter(([,v])=>v).map(([k])=>actionLabels[k] ?? k).join(', ') || '—'}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">{emp.created_at}</div>
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
