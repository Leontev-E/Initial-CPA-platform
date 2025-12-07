import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageToggle from '@/Components/LanguageToggle';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-slate-50 pt-6 sm:justify-center sm:pt-0">
            <LanguageToggle />
            <div className="flex items-center gap-3">
                <Link href={route('login')}>
                    <ApplicationLogo className="h-16 w-auto" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-lg sm:max-w-md sm:rounded-xl">
                {children}
            </div>
            <footer className="fixed bottom-0 left-0 right-0 bg-white/90 px-4 py-3 text-center text-xs text-gray-600 shadow-inner">
                <a className="text-indigo-600" href="https://boostclicks.ru">https://boostclicks.ru</a> BoostClicks - Евгений Леонтьев <a className="text-indigo-600" href="https://t.me/boostclicks">https://t.me/boostclicks</a>
            </footer>
        </div>
    );
}
