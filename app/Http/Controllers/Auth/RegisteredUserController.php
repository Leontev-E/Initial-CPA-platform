<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PartnerProgram;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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
        $telegramInput = $request->input('telegram', '');
        $normalizedTelegram = str_starts_with($telegramInput, '@') ? $telegramInput : '@'.$telegramInput;
        $request->merge(['telegram' => $normalizedTelegram]);

        // Support legacy Breeze-style payloads (name/email) by mapping to program fields when missing.
        $request->merge([
            'program_name' => $request->input('program_name') ?? $request->input('name'),
            'contact_email' => $request->input('contact_email') ?? $request->input('email'),
        ]);

        $validated = $request->validate([
            'program_name' => ['required', 'string', 'max:255'],
            'contact_email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'telegram' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'telegram'),
            ],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'password.confirmed' => 'Пароли не совпадают',
            'password.min' => 'Минимальная длина пароля 8 символов',
            'contact_email.unique' => 'Email уже используется, выберите другой.',
            'telegram.unique' => 'Telegram уже используется, выберите другой.',
        ]);

        $slug = $this->uniqueSlug($validated['program_name']);
        $code = random_int(100000, 999999);

        // Cache pending registration (15 minutes); nothing persisted until verification
        Cache::put('pending_registration_'.$validated['contact_email'], [
            'data' => [
                'program_name' => $validated['program_name'],
                'program_slug' => $slug,
                'contact_email' => $validated['contact_email'],
                'telegram' => $validated['telegram'],
                'password_hash' => Hash::make($validated['password']),
            ],
            'code' => $code,
        ], now()->addMinutes(15));

        try {
            Mail::send('emails.verify_code', ['code' => $code, 'user' => (object) ['name' => $validated['program_name'], 'email' => $validated['contact_email']]], function ($message) use ($validated) {
                $message->to($validated['contact_email'])->subject('Код подтверждения BoostClicks');
            });
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'email' => 'Не удалось отправить код. Проверьте почту или повторите позже.',
            ]);
        }

        return redirect()->route('verify.code.show', ['email' => $validated['contact_email']]);
    }

    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'program';
        $slug = $base;
        $counter = 1;

        while (PartnerProgram::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
