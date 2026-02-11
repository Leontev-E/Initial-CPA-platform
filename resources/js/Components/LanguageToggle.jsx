import { router, usePage } from '@inertiajs/react';

export default function LanguageToggle() {
    const { props } = usePage();
    const current = props.locale || 'ru';

    const switchLocale = (locale) => {
        router.post(route('locale.switch'), { locale }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 text-xs text-gray-600">
            <button
                onClick={() => switchLocale('ru')}
                className={`rounded-full px-2 py-1 ${current === 'ru' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-700'}`}
            >
                RU
            </button>
            <button
                onClick={() => switchLocale('en')}
                className={`rounded-full px-2 py-1 ${current === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-700'}`}
            >
                EN
            </button>
        </div>
    );
}
