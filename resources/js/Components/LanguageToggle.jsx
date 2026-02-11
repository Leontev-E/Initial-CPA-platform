import { usePage } from '@inertiajs/react';

export default function LanguageToggle({ className = '' }) {
    const { props } = usePage();
    const current = props.locale || 'ru';

    const switchLocale = (locale) => {
        if (typeof window === 'undefined') {
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('lang', locale);
        window.location.assign(url.toString());
    };

    return (
        <div className={`flex items-center gap-2 text-xs text-gray-600 ${className}`}>
            <button
                type="button"
                onClick={() => switchLocale('ru')}
                className={`rounded-full px-2 py-1 ${current === 'ru' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-700'}`}
            >
                RU
            </button>
            <button
                type="button"
                onClick={() => switchLocale('en')}
                className={`rounded-full px-2 py-1 ${current === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-700'}`}
            >
                EN
            </button>
        </div>
    );
}
