import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function VerifyCode({ userId, email }) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: userId,
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('verify.code.store'));
    };

    return (
        <GuestLayout>
            <Head title="Подтверждение" />
            <div className="mb-2 text-sm text-gray-700">
                Мы отправили код на почту {email}. Введите его ниже для завершения регистрации.
            </div>
            <form onSubmit={submit} className="space-y-3">
                <TextInput
                    type="text"
                    name="code"
                    value={data.code}
                    className="mt-1 block w-full"
                    onChange={(e) => setData('code', e.target.value)}
                    placeholder="Код из письма"
                    isFocused
                />
                <InputError message={errors.code} className="mt-1" />
                <PrimaryButton disabled={processing} className="w-full justify-center">
                    Подтвердить
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
