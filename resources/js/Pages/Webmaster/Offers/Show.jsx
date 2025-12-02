import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Show({ offer }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">{offer.name}</h2>}
        >
            <Head title={offer.name} />
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-2 space-y-3">
                    {offer.image_url && (
                        <img
                            src={offer.image_url}
                            alt={offer.name}
                            className="h-52 w-full rounded object-contain bg-slate-50"
                        />
                    )}
                    <div className="text-sm text-gray-700">
                        {offer.description}
                    </div>
                    {offer.notes && (
                        <div className="rounded border px-3 py-2 text-sm text-gray-700">
                            <div className="text-xs uppercase text-gray-500">Примечание</div>
                            <div>{offer.notes}</div>
                        </div>
                    )}
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
