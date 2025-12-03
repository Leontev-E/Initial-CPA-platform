import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const allowedSections = user.invited_by ? (user.permissions?.sections || []) : null;

    const navItems = useMemo(() => {
        if (user.role === 'admin') {
            return [
                { label: 'Дашборд партнерской программы', name: 'admin.dashboard', section: null },
                { label: 'Категории', name: 'admin.offer-categories.index', section: 'categories' },
                { label: 'Офферы', name: 'admin.offers.index', section: 'offers' },
                { label: 'Лиды', name: 'admin.leads.index', section: 'leads' },
                { label: 'Вебмастера', name: 'admin.webmasters.index', section: 'webmasters' },
                { label: 'Аналитика', name: 'admin.reports.offers', section: 'reports' },
                { label: 'Выплаты', name: 'admin.payouts.index', section: 'payouts' },
            ];
        }

        return [
            { label: 'Дашборд вебмастера', name: 'webmaster.dashboard', section: null },
            { label: 'Офферы', name: 'webmaster.offers.index', section: null },
            { label: 'Статистика', name: 'webmaster.leads.index', section: null },
            { label: 'Инструменты', name: 'webmaster.tools.index', section: null },
            { label: 'Выплаты', name: 'webmaster.payouts.index', section: null },
        ];
    }, [user.role]);

    const isActive = (name) =>
        route().current(name) || route().current(`${name}.*`);

    const formatLastLogin = (value) => {
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

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className="hidden w-64 flex-col border-r bg-white/90 p-4 pb-16 shadow-sm lg:flex">
                <div className="flex items-center gap-2 px-2 pb-6">
                    <ApplicationLogo className="h-10 w-10 text-indigo-600" />
                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            BoostClicks CPA Platform
                        </div>
                        <div className="text-xs text-gray-500">
                            {user.role === 'admin'
                                ? 'Кабинет ПП'
                                : 'Кабинет вебмастера'}
                        </div>
                    </div>
                </div>
                <nav className="space-y-1">
                    {navItems
                        .filter((item) => {
                            if (!allowedSections || item.section === null) return true;
                            return allowedSections.includes(item.section);
                        })
                        .map((item) => (
                            <Link
                                key={item.name}
                                href={route(item.name)}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-indigo-50 hover:text-indigo-700 ${
                                    isActive(item.name)
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-700'
                                }`}
                            >
                                {item.label}
                                {isActive(item.name) && (
                                    <span className="h-2 w-2 rounded-full bg-white" />
                                )}
                            </Link>
                        ))}
                </nav>
                <div className="mt-auto space-y-2 border-t pt-4 text-sm text-gray-600">
                    <Link href={route('profile.edit')} className="block rounded-lg border border-indigo-100 px-3 py-2 transition hover:border-indigo-300 hover:bg-indigo-50">
                        <div className="font-semibold text-gray-800">
                            {user.name}
                        </div>
                        <div className="text-indigo-600">{user.email}</div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Личный кабинет</div>
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700 transition hover:bg-gray-200"
                    >
                        Выйти
                    </Link>
                </div>
            </aside>

            <div className="flex-1 pb-16">
                <header className="border-b bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            {header ? (
                                header
                            ) : (
                                <div className="text-lg font-semibold text-gray-900">
                                    Добро пожаловать, {user.name}!
                                </div>
                            )}
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                                {user.role === 'admin' ? 'Партнерская программа' : 'Кабинет вебмастера'}
                            </div>
                        </div>
                            <div className="flex items-center gap-4 text-right text-xs text-gray-500">
                                <Link
                                    href={route('profile.edit')}
                                    className="rounded-full border border-indigo-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                                >
                                    Личный кабинет
                                </Link>
                            <div>{formatLastLogin(user.last_login_at)}</div>
                            </div>
                        </div>
                </header>

                <main className="p-4 lg:p-8">{children}</main>
                <footer className="fixed bottom-0 left-0 right-0 border-t bg-white/90 px-4 py-3 text-center text-xs text-gray-600 shadow-inner">
                    <a className="text-indigo-600" href="https://boostclicks.ru">https://boostclicks.ru</a> BoostClicks - Евгений Леонтьев <a className="text-indigo-600" href="https://t.me/boostclicks">https://t.me/boostclicks</a>
                </footer>
            </div>
        </div>
    );
}
