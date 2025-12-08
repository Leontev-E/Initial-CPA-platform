import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            payout_wallets: user.payout_wallets ?? [],
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    const addWallet = () => {
        setData('payout_wallets', [
            ...(data.payout_wallets || []),
            { type: 'USDT TRC20', details: '' },
        ]);
    };

    const updateWallet = (idx, field, value) => {
        setData(
            'payout_wallets',
            (data.payout_wallets || []).map((item, i) =>
                i === idx ? { ...item, [field]: value } : item,
            ),
        );
    };

    const removeWallet = (idx) => {
        setData(
            'payout_wallets',
            (data.payout_wallets || []).filter((_, i) => i !== idx),
        );
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Данные профиля
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Обновите данные профиля и при необходимости сохраните реквизиты для выплат.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Название партнерской программы" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {user.role === 'webmaster' && (
                    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800">Платежные реквизиты</h3>
                            <p className="text-xs text-gray-500">
                                Сохраните варианты выплат (USDT TRC20, карта или другое) и выбирайте их при создании заявки на вывод.
                            </p>
                        </div>
                        {(data.payout_wallets || []).map((wallet, idx) => (
                            <div key={idx} className="space-y-2 rounded border px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <select
                                        className="h-10 rounded border px-3 text-sm"
                                        value={wallet.type}
                                        onChange={(e) => updateWallet(idx, 'type', e.target.value)}
                                    >
                                        <option value="USDT TRC20">USDT TRC20</option>
                                        <option value="Card">Card</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => removeWallet(idx)}
                                        className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    >
                                        Удалить
                                    </button>
                                </div>
                                <div>
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={wallet.details}
                                        onChange={(e) => updateWallet(idx, 'details', e.target.value)}
                                        placeholder={
                                            wallet.type === 'USDT TRC20'
                                                ? 'Адрес кошелька (TRC20)'
                                                : wallet.type === 'Card'
                                                  ? 'Номер карты / банк'
                                                  : 'Описание реквизита'
                                        }
                                        required
                                    />
                                    <InputError className="mt-1" message={errors[`payout_wallets.${idx}.type`]} />
                                    <InputError className="mt-1" message={errors[`payout_wallets.${idx}.details`]} />
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={addWallet}
                                className="rounded border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                                Добавить реквизит
                            </button>
                            {errors.payout_wallets && (
                                <div className="text-xs text-red-600">{errors.payout_wallets}</div>
                            )}
                            {data.payout_wallets.length === 0 && (
                                <span className="text-xs text-gray-500">Добавьте хотя бы один способ, чтобы выводить средства.</span>
                            )}
                        </div>
                    </div>
                )}

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Ваш email не подтвержден.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Отправить письмо повторно.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Новая ссылка подтверждения отправлена на вашу почту.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Сохранить</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Сохранено
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
