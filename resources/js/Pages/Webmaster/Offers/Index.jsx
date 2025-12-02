import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ offers }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Офферы</h2>}
        >
            <Head title="Офферы" />
            <div className="grid gap-4 md:grid-cols-2">
                {offers.map((offer) => (
                    <Link
                        key={offer.id}
                        href={route('webmaster.offers.show', offer.id)}
                        className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            {offer.image_url && (
                                <img
                                    src={offer.image_url}
                                    alt={offer.name}
                                    className="h-14 w-14 rounded object-cover"
                                />
                            )}
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {offer.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    GEO: {(offer.allowed_geos || []).join(', ')}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-indigo-700">
                            Ставка: {offer.effective_payout} $
                        </div>
                    </Link>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
