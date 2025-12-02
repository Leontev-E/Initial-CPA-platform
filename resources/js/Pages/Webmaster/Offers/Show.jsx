import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Show({ offer }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">{offer.name}</h2>}
        >
            <Head title={offer.name} />
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-2">
                    <div className="text-sm text-gray-700">
                        {offer.description}
                    </div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm space-y-2 text-sm text-gray-700">
                    <div>GEO: {(offer.allowed_geos || []).join(', ')}</div>
                    <div>Default payout: {offer.default_payout} $</div>
                    <div className="font-semibold text-indigo-700">
                        Ваша ставка: {offer.effective_payout} $
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
