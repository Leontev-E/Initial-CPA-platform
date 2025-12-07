import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Index({ auth, programs, currentPartnerProgramId }) {
    const { post } = useForm({});

    const switchContext = (id) => {
        post(route('super-admin.partner-programs.switch', id));
    };

    const resetContext = () => {
        post(route('super-admin.partner-programs.reset'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Партнерские программы" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Партнерские программы</h1>
                    <p className="text-sm text-gray-600">
                        Управление всеми партнерскими программами платформы.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={route('super-admin.partner-programs.create')}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                    >
                        Создать программу
                    </Link>
                    {currentPartnerProgramId && (
                        <button
                            type="button"
                            onClick={resetContext}
                            className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Сбросить контекст
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Название</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Статус</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Офферы</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Вебмастера</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Лимиты</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Домен</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Email</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(programs.data || []).map((program) => (
                            <tr key={program.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="font-semibold text-gray-900">{program.name}</div>
                                    <div className="text-xs text-gray-500">/{program.slug}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${program.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {program.status === 'active' ? 'Активна' : 'Неактивна'}
                                    </span>
                                    {currentPartnerProgramId === program.id && (
                                        <span className="ml-2 inline-flex rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase text-indigo-700">
                                            Текущий контекст
                                        </span>
                                    )}
                                    {program.is_blocked && (
                                        <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase text-rose-700">
                                            Заблокирована
                                        </span>
                                    )}
                                    {program.is_unlimited && (
                                        <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700">
                                            Без лимитов
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {program.offers_count}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {program.webmasters_count}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    <div>Офферы: {program.offer_limit ?? '—'}</div>
                                    <div>Вебмастера: {program.webmaster_limit ?? '—'}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{program.domain || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{program.contact_email || '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={route('super-admin.partner-programs.edit', program.id)}
                                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            Редактировать
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => switchContext(program.id)}
                                            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                                        >
                                            Открыть
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
                    <div>
                        Показано {programs.from ?? 0}–{programs.to ?? 0} из {programs.total ?? 0}
                    </div>
                    <div className="flex items-center gap-2">
                        {(programs.links || []).map((link) => (
                            <Link
                                key={link.label}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                            ? 'text-indigo-600 hover:bg-indigo-50'
                                            : 'text-gray-400'
                                }`}
                                preserveScroll
                                preserveState
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
