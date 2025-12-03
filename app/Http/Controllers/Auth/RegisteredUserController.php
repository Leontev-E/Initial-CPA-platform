<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $existing = User::query()
            ->where(function ($q) use ($request) {
                $q->where('email', $request->email)
                    ->orWhere('telegram', $request->telegram);
            })
            ->first();

        if ($existing && $existing->email_verified_at) {
            // Уже подтвержденный пользователь
            throw ValidationException::withMessages([
                'email' => 'Данный email уже подтвержден. Обратитесь к менеджеру.',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($existing?->id),
            ],
            'telegram' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'telegram')->ignore($existing?->id),
            ],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'password.confirmed' => 'Пароли не совпадают',
            'password.min' => 'Минимальная длина пароля 8 символов',
            'email.unique' => 'Email уже используется, но не подтвержден. Введите код из письма или запросите новый.',
            'telegram.unique' => 'Telegram уже используется, но не подтвержден.',
        ]);

        $telegram = $validated['telegram'];
        if (! str_starts_with($telegram, '@')) {
            $telegram = '@'.$telegram;
        }

        if ($existing) {
            $user = tap($existing)->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'telegram' => $telegram,
                'password' => $validated['password'],
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => null,
            ]);
        } else {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'telegram' => $telegram,
                'password' => $validated['password'],
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => null,
            ]);
        }

        $code = random_int(100000, 999999);
        Cache::put('verify_code_'.$user->id, $code, now()->addMinutes(15));

        try {
            Mail::send('emails.verify_code', ['code' => $code, 'user' => $user], function ($message) use ($user) {
                $message->to($user->email)->subject('Код подтверждения BoostClicks');
            });
        } catch (\Throwable $e) {
            // Если почта не настроена, вернуть ошибку
            $user->delete();
            throw ValidationException::withMessages([
                'email' => 'Не удалось отправить код. Проверьте почту.',
            ]);
        }

        return redirect()->route('verify.code.show', ['user' => $user->id, 'email' => $user->email]);
    }
}
