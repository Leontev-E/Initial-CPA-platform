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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

        $partnerProgram = PartnerProgram::create([
            'name' => $validated['program_name'],
            'slug' => $this->uniqueSlug($validated['program_name']),
            'contact_email' => $validated['contact_email'],
            'status' => 'active',
        ]);

        $user = User::create([
            'name' => $validated['program_name'],
            'email' => $validated['contact_email'],
            'telegram' => $validated['telegram'],
            'password' => $validated['password'],
            'role' => User::ROLE_ADMIN,
            'partner_program_id' => $partnerProgram->id,
            'email_verified_at' => null,
        ]);

        event(new Registered($user));
        Auth::login($user);

        $code = random_int(100000, 999999);
        Cache::put('verify_code_'.$user->id, $code, now()->addMinutes(15));

        try {
            Mail::send('emails.verify_code', ['code' => $code, 'user' => $user], function ($message) use ($user) {
                $message->to($user->email)->subject('Код подтверждения BoostClicks');
            });
        } catch (\Throwable $e) {
            $user->delete();
            $partnerProgram->delete();

            throw ValidationException::withMessages([
                'email' => 'Не удалось отправить код. Проверьте почту или повторите позже.',
            ]);
        }

        return redirect()->to(route('dashboard', [], false));
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
