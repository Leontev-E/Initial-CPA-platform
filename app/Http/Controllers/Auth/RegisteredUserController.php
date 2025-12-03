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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'telegram' => 'required|string|max:255|unique:users,telegram',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $validated['email'],
            'telegram' => $validated['telegram'],
            'password' => $request->password,
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => null,
        ]);

        $code = random_int(100000, 999999);
        Cache::put('verify_code_'.$user->id, $code, now()->addMinutes(15));

        try {
            Mail::raw("Ваш код подтверждения: {$code}", function ($message) use ($user) {
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
