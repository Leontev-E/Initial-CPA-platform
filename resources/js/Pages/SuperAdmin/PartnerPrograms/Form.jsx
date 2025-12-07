import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Form({ auth, program }) {
    const isEdit = Boolean(program);
    const { data, setData, post, put, processing, errors } = useForm({
        name: program?.name ?? '',
        slug: program?.slug ?? '',
        contact_email: program?.contact_email ?? '',
        status: program?.status ?? 'active',
        domain: program?.domain ?? '',
        offer_limit: program?.offer_limit ?? 15,
        webmaster_limit: program?.webmaster_limit ?? 40,
        is_unlimited: program?.is_unlimited ?? false,
        is_blocked: program?.is_blocked ?? false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('super-admin.partner-programs.update', program.id));
        } else {
            post(route('super-admin.partner-programs.store'));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEdit ? 'Редактирование программы' : 'Создание программы'} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {isEdit ? 'Редактирование программы' : 'Создание программы'}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {isEdit ? `Измените данные партнерской программы ${program.name}` : 'Добавьте новую партнерскую программу.'}
                    </p>
                </div>
                <Link
                    href={route('super-admin.partner-programs.index')}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Назад
                </Link>
            </div>

            <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6 shadow">
                <div>
                    <InputLabel htmlFor="name" value="Название" />
                    <TextInput
                        id="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="slug" value="Slug" />
                        <TextInput
                            id="slug"
                            value={data.slug}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="my-program"
                        />
                        <InputError message={errors.slug} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="domain" value="Домен (опционально)" />
                        <TextInput
                            id="domain"
                            value={data.domain}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('domain', e.target.value)}
                            placeholder="cpa.example.com"
                        />
                        <InputError message={errors.domain} className="mt-2" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="contact_email" value="Контактный email" />
                        <TextInput
                            id="contact_email"
                            value={data.contact_email}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('contact_email', e.target.value)}
                            placeholder="support@example.com"
                        />
                        <InputError message={errors.contact_email} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="status" value="Статус" />
                        <select
                            id="status"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="active">Активна</option>
                            <option value="inactive">Неактивна</option>
                        </select>
                        <InputError message={errors.status} className="mt-2" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="offer_limit" value="Лимит офферов" />
                        <TextInput
                            id="offer_limit"
                            type="number"
                            min="0"
                            value={data.offer_limit ?? ''}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('offer_limit', e.target.value === '' ? null : Number(e.target.value))}
                            disabled={data.is_unlimited}
                        />
                        <InputError message={errors.offer_limit} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="webmaster_limit" value="Лимит вебмастеров" />
                        <TextInput
                            id="webmaster_limit"
                            type="number"
                            min="0"
                            value={data.webmaster_limit ?? ''}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('webmaster_limit', e.target.value === '' ? null : Number(e.target.value))}
                            disabled={data.is_unlimited}
                        />
                        <InputError message={errors.webmaster_limit} className="mt-2" />
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input
                            type="checkbox"
                            checked={data.is_unlimited}
                            onChange={(e) => setData('is_unlimited', e.target.checked)}
                        />
                        Без лимитов
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 text-rose-700">
                        <input
                            type="checkbox"
                            checked={data.is_blocked}
                            onChange={(e) => setData('is_blocked', e.target.checked)}
                        />
                        Заблокировать программу
                    </label>
                </div>

                <PrimaryButton disabled={processing}>
                    {processing ? 'Сохранение...' : 'Сохранить'}
                </PrimaryButton>
            </form>
        </AuthenticatedLayout>
    );
}
