<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            'email' => 'nullable|string|lowercase|email|max:255|unique:'.User::class,
            'telegram' => 'nullable|string|max:255|unique:users,telegram',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        if (empty($validated['email']) && empty($validated['telegram'])) {
            throw ValidationException::withMessages([
                'email' => 'Укажите email или Telegram',
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $validated['email'] ?? null,
            'telegram' => $validated['telegram'] ?? null,
            'password' => $request->password,
            'role' => User::ROLE_WEBMASTER,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
