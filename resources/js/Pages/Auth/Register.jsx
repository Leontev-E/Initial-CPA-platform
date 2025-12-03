import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        telegram: '',
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const passwordsMatch = useMemo(
        () =>
            data.password.length >= 8 &&
            data.password_confirmation.length >= 8 &&
            data.password === data.password_confirmation,
        [data.password, data.password_confirmation],
    );

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Регистрация партнерской программы" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Название CPA сети" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                            placeholder="user@example.com"
                            required
                        />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="telegram" value="Telegram" />

                    <TextInput
                        id="telegram"
                        type="text"
                        name="telegram"
                        value={data.telegram}
                        className="mt-1 block w-full"
                            onChange={(e) => {
                                const v = e.target.value.startsWith('@')
                                    ? e.target.value
                                    : '@' + e.target.value;
                                setData('telegram', v);
                            }}
                            placeholder="@username"
                            required
                        />

                    <InputError message={errors.telegram} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Пароль" />

                    <div className="relative">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className={`mt-1 block w-full ${passwordsMatch ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`}
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            placeholder="Минимум 8 символов"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute inset-y-0 right-3 mt-1 flex items-center text-xs text-gray-500"
                        >
                            {showPassword ? 'Скрыть' : 'Показать'}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Подтверждение пароля"
                    />

                    <div className="relative">
                        <TextInput
                            id="password_confirmation"
                            type={showPasswordConfirm ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className={`mt-1 block w-full ${passwordsMatch ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`}
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                            placeholder="Повторите пароль"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPasswordConfirm((v) => !v)
                            }
                            className="absolute inset-y-0 right-3 mt-1 flex items-center text-xs text-gray-500"
                        >
                            {showPasswordConfirm ? 'Скрыть' : 'Показать'}
                        </button>
                    </div>
                    {passwordsMatch && (
                        <div className="text-xs text-green-600 mt-1">
                            Пароли совпадают
                        </div>
                    )}

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Уже есть аккаунт?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Зарегистрироваться
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
