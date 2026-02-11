import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import LanguageToggle from '@/Components/LanguageToggle';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, impersonating, partnerProgram } = usePage().props;
    const user = auth.user;
    const wmMeta = auth.webmasterMeta;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [installEvent, setInstallEvent] = useState(null);
    const isMobile = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    }, []);

    const allowedSections = user.invited_by ? (user.permissions?.sections || []) : null;

    const navItems = useMemo(() => {
        if (user.role === 'super_admin') {
            return [
                { label: 'Партнерские программы', name: 'super-admin.partner-programs.index', section: null },
                partnerProgram
                    ? { label: `Админка: ${partnerProgram.name}`, name: 'admin.dashboard', section: null }
                    : null,
            ].filter(Boolean);
        }

        if (user.role === 'admin') {
            return [
                { label: 'Дашборд', name: 'admin.dashboard', section: null },
                { label: 'Категории', name: 'admin.offer-categories.index', section: 'categories' },
                { label: 'Офферы', name: 'admin.offers.index', section: 'offers' },
                { label: 'Лиды', name: 'admin.leads.index', section: 'leads' },
                { label: 'Вебмастера', name: 'admin.webmasters.index', section: 'webmasters' },
                { label: 'SmartLinks', name: 'admin.smart-links.index', section: 'offers' },
                { label: 'Отчеты', name: 'admin.reports.offers', section: 'reports' },
                { label: 'Выплаты', name: 'admin.payouts.index', section: 'payouts', badge: auth.pendingPayouts },
                { label: 'Вебхуки', name: 'admin.webhooks.index', section: 'webhooks' },
            ];
        }

        return [
            { label: 'Главная', name: 'webmaster.dashboard', section: null },
            { label: 'Офферы', name: 'webmaster.offers.index', section: null },
            { label: 'Статистика', name: 'webmaster.leads.index', section: null },
            { label: 'Инструменты', name: 'webmaster.tools.index', section: null },
            { label: 'Выплаты', name: 'webmaster.payouts.index', section: null },
        ];
    }, [user.role, partnerProgram, auth.pendingPayouts]);

    const isActive = (name) =>
        route().current(name) || route().current(`${name}.*`);

    useEffect(() => {
        const handler = (e) => {
            if (!isMobile) {
                return;
            }
            e.preventDefault();
            setInstallEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [isMobile]);

    const formatLastLogin = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `Последний вход: ${dd}.${mm}.${yyyy} в ${hh}:${min}`;
    };

    const formatMoney = (value) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return '0.00';
        }
        return Number(value).toFixed(2);
    };

    const Navigation = () => (
        <>
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
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="flex items-center gap-2">
                                {item.label}
                                {item.badge ? (
                                    <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-2 py-[2px] text-[10px] font-semibold text-white">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </span>
                            {isActive(item.name) && (
                                <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                        </Link>
                    ))}
            </nav>
            <div className="mt-auto space-y-2 border-t pt-4 text-sm text-gray-600">
                <LanguageToggle className="mb-1 justify-start" />
                <Link href={route('profile.edit')} className="block rounded-lg border border-indigo-100 px-3 py-2 transition hover:border-indigo-300 hover:bg-indigo-50">
                    <div className="font-semibold text-gray-800">
                        {user.name}
                    </div>
                    <div className="text-indigo-600 break-all">{user.email}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Личный кабинет</div>
                </Link>
                {user.role === 'webmaster' && wmMeta && (
                    <div className="rounded-lg border bg-slate-50 px-3 py-2">
                        <div className="text-[11px] uppercase text-gray-500">Баланс</div>
                        <div className={`text-sm font-semibold ${wmMeta.balance >= wmMeta.min_payout ? 'text-green-700' : 'text-gray-600'}`}>
                            {formatMoney(wmMeta.balance)} $
                        </div>
                        <div className="text-[11px] text-gray-500">Мин. к выплате: {formatMoney(wmMeta.min_payout)} $</div>
                    </div>
                )}
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                    Выйти
                </Link>
            </div>
        </>
    );

    const roleSubtitle = () => {
        if (user.role === 'super_admin') {
            return 'Суперадмин';
        }
        if (user.role === 'admin') {
            return partnerProgram?.name || 'Партнерская программа';
        }
        return 'Кабинет вебмастера';
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className="hidden w-64 flex-col border-r bg-white/90 p-4 pb-16 shadow-sm lg:flex">
                <div className="flex items-center gap-2 px-2 pb-6">
                    <ApplicationLogo className="h-10 w-10" />
                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            BoostClicks CPA Platform
                        </div>
                        <div className="text-xs text-gray-500">
                            {roleSubtitle()}
                        </div>
                    </div>
                </div>
                <Navigation />
            </aside>

            <div className="flex-1 pb-24">
                {impersonating && (
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 text-sm flex items-center justify-between">
                        <div>Вы работаете в режиме имперсонации.</div>
                        <Link
                            href={route('webmasters.stopImpersonate')}
                            method="post"
                            as="button"
                            className="rounded bg-amber-200 px-3 py-1 text-xs font-semibold hover:bg-amber-300"
                        >
                            Выйти из режима
                        </Link>
                    </div>
                )}
                <header className="border-b bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 lg:hidden"
                                    onClick={() => setMobileOpen((v) => !v)}
                                    aria-label="Открыть меню"
                                >
                                    <span className="block h-0.5 w-5 bg-current mb-1"></span>
                                    <span className="block h-0.5 w-5 bg-current mb-1"></span>
                                    <span className="block h-0.5 w-5 bg-current"></span>
                                </button>
                                <div>
                                    {header ? (
                                        header
                                    ) : (
                                        <div className="text-lg font-semibold text-gray-900">
                                            Добро пожаловать, {user.name}!
                                        </div>
                                    )}
                                    <div className="text-xs uppercase tracking-wide text-gray-500">
                                        {roleSubtitle()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                            <Link
                                href={route('profile.edit')}
                                className="rounded-full border border-indigo-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                Профиль
                            </Link>
                            <div className="text-right">{formatLastLogin(user.last_login_at)}</div>
                            {user.role === 'webmaster' && installEvent && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        installEvent.prompt();
                                        installEvent.userChoice.finally(() => setInstallEvent(null));
                                    }}
                                    className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    Установить приложение
                                </button>
                            )}
                        </div>
                    </div>

                    {mobileOpen && (
                        <div className="mt-3 rounded-xl border bg-white p-3 shadow-lg lg:hidden">
                            <Navigation />
                        </div>
                    )}
                </header>

                <main className="p-4 lg:p-8">{children}</main>
                <footer className="fixed bottom-0 left-0 right-0 border-t bg-white/90 px-4 py-3 text-center text-xs text-gray-600 shadow-inner">
                    <a className="text-indigo-600" href="https://boostclicks.ru">https://boostclicks.ru</a> BoostClicks - партнерская платформа <a className="text-indigo-600" href="https://t.me/boostclicks">https://t.me/boostclicks</a>
                </footer>
            </div>
        </div>
    );
}
