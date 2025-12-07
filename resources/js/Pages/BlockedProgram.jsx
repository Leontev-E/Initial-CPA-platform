import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function BlockedProgram({ program }) {
    return (
        <GuestLayout>
            <Head title="Доступ заблокирован" />
            <div className="mx-auto max-w-3xl rounded-2xl border border-rose-100 bg-white/80 p-8 shadow">
                <div className="mb-4 text-2xl font-semibold text-gray-900">Доступ заблокирован</div>
                <p className="text-gray-700">
                    Кабинет партнерской программы <strong>{program?.name ?? '—'}</strong> временно недоступен.
                    Пожалуйста, свяжитесь с поддержкой или администратором для разблокировки.
                </p>
            </div>
        </GuestLayout>
    );
}
