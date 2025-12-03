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

class VerifyCodeController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/VerifyCode', [
            'userId' => $request->query('user'),
            'email' => $request->query('email'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'code' => ['required', 'numeric'],
        ]);

        $user = User::findOrFail($data['user_id']);
        $cachedCode = Cache::get('verify_code_'.$user->id);

        if ((string) $cachedCode !== (string) $data['code']) {
            throw ValidationException::withMessages([
                'code' => 'Неверный код',
            ]);
        }

        $user->forceFill(['email_verified_at' => now()])->save();
        Cache::forget('verify_code_'.$user->id);

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
