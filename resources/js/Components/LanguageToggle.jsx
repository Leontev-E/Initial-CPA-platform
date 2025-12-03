import { Link, usePage } from '@inertiajs/react';

export default function LanguageToggle() {
    const { props } = usePage();
    // пока заглушка для будущей локализации
    return (
        <div className="fixed right-4 top-4 flex items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-slate-100 px-2 py-1">RU</span>
            <span className="rounded-full bg-slate-50 px-2 py-1">EN</span>
        </div>
    );
}
