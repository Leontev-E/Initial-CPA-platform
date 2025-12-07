<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\PartnerProgram;

class VerifyCodeController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/VerifyCode', [
            'email' => $request->query('email'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'numeric'],
        ]);

        $pending = Cache::get('pending_registration_'.$data['email']);
        $cachedCode = $pending['code'] ?? null;

        if ((string) $cachedCode !== (string) $data['code']) {
            throw ValidationException::withMessages([
                'code' => 'Неверный код',
            ]);
        }

        $payload = $pending['data'] ?? null;
        if (! $payload) {
            throw ValidationException::withMessages([
                'code' => 'Срок действия кода истёк, запросите новый.',
            ]);
        }

        // Re-check uniqueness before persisting
        if (User::where('email', $payload['contact_email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => 'Email уже используется.',
            ]);
        }

        if (User::where('telegram', $payload['telegram'])->exists()) {
            throw ValidationException::withMessages([
                'email' => 'Telegram уже используется.',
            ]);
        }

        $partnerProgram = PartnerProgram::create([
            'name' => $payload['program_name'],
            'slug' => $this->uniqueSlug($payload['program_slug'] ?? $payload['program_name']),
            'contact_email' => $payload['contact_email'],
            'status' => 'active',
        ]);

        $user = User::create([
            'name' => $payload['program_name'],
            'email' => $payload['contact_email'],
            'telegram' => $payload['telegram'],
            'password' => $payload['password_hash'],
            'role' => User::ROLE_ADMIN,
            'partner_program_id' => $partnerProgram->id,
            'email_verified_at' => now(),
        ]);

        Cache::forget('pending_registration_'.$data['email']);
        Auth::login($user);

        return redirect()->route('dashboard');
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
