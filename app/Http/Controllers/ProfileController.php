<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $employees = [];
        if ($user->isAdmin()) {
            $employees = User::where('invited_by', $user->id)
                ->orderBy('created_at', 'desc')
                ->get(['id', 'name', 'email', 'telegram', 'employee_role', 'permissions', 'created_at']);
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'employees' => $employees,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    public function invite(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->isAdmin() && $user->invited_by === null, 403);

        $telegramInput = $request->input('telegram', '');
        $normalizedTelegram = str_starts_with($telegramInput, '@') ? $telegramInput : '@'.$telegramInput;
        $request->merge(['telegram' => $normalizedTelegram]);

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telegram' => ['required', 'string', 'max:255', 'unique:users,telegram'],
            'employee_role' => ['required', 'in:admin,tech,accounting,operator'],
            'sections' => ['array'],
            'sections.*' => ['string'],
            'actions' => ['array'],
            'actions.create' => ['boolean'],
            'actions.update' => ['boolean'],
            'actions.delete' => ['boolean'],
            'actions.impersonate' => ['boolean'],
            'actions.impersonate_employee' => ['boolean'],
        ], [
            'email.unique' => 'Email уже используется',
            'telegram.unique' => 'Telegram уже используется',
        ]);

        $telegram = str_starts_with($data['telegram'], '@') ? $data['telegram'] : '@'.$data['telegram'];
        $passwordPlain = Str::random(10);

        $employee = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'telegram' => $telegram,
            'password' => $passwordPlain,
            'role' => User::ROLE_ADMIN,
            'employee_role' => $data['employee_role'],
            'permissions' => [
                'sections' => $data['sections'] ?? [],
                'actions' => [
                    'create' => $data['actions']['create'] ?? false,
                    'update' => $data['actions']['update'] ?? false,
                    'delete' => $data['actions']['delete'] ?? false,
                    'impersonate' => $data['actions']['impersonate'] ?? false,
                    'impersonate_employee' => $data['actions']['impersonate_employee'] ?? false,
                ],
            ],
            'invited_by' => $user->id,
            'email_verified_at' => now(),
        ]);

        Mail::send('emails.employee_invite', [
            'employee' => $employee,
            'inviter' => $user,
            'password' => $passwordPlain,
        ], function ($message) use ($employee) {
            $message->to($employee->email)->subject('Приглашение в BoostClicks');
        });

        return back()->with('success', 'Данные для входа отправлены сотруднику '.$employee->email.' с ролью '.$employee->employee_role);
    }

    public function updateEmployee(Request $request, User $user): RedirectResponse
    {
        $owner = $request->user();
        abort_unless($owner->isAdmin() && $owner->invited_by === null, 403);
        abort_if($user->id === $owner->id, 403);
        abort_if($user->invited_by !== $owner->id, 403);

        $telegramInput = $request->input('telegram', '');
        $normalizedTelegram = str_starts_with($telegramInput, '@') ? $telegramInput : '@'.$telegramInput;
        $request->merge(['telegram' => $normalizedTelegram]);

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'telegram' => ['required', 'string', 'max:255', 'unique:users,telegram,'.$user->id],
            'employee_role' => ['required', 'in:admin,tech,accounting,operator'],
            'sections' => ['array'],
            'sections.*' => ['string'],
            'actions' => ['array'],
            'actions.create' => ['boolean'],
            'actions.update' => ['boolean'],
            'actions.delete' => ['boolean'],
            'actions.impersonate' => ['boolean'],
            'actions.impersonate_employee' => ['boolean'],
        ]);

        $user->update([
            'name' => $data['name'],
            'telegram' => $data['telegram'],
            'employee_role' => $data['employee_role'],
            'permissions' => [
                'sections' => $data['sections'] ?? [],
                'actions' => [
                    'create' => $data['actions']['create'] ?? false,
                    'update' => $data['actions']['update'] ?? false,
                    'delete' => $data['actions']['delete'] ?? false,
                    'impersonate' => $data['actions']['impersonate'] ?? false,
                    'impersonate_employee' => $data['actions']['impersonate_employee'] ?? false,
                ],
            ],
        ]);

        return back()->with('success', 'Данные сотрудника обновлены');
    }

    public function destroyEmployee(Request $request, User $user): RedirectResponse
    {
        $owner = $request->user();
        abort_unless($owner->isAdmin() && $owner->invited_by === null, 403);
        abort_if($user->id === $owner->id, 403);
        abort_if($user->invited_by !== $owner->id, 403);

        $user->delete();

        return back()->with('success', 'Сотрудник удален');
    }

    public function impersonateEmployee(Request $request, User $user): RedirectResponse
    {
        $owner = $request->user();
        abort_unless($owner->isAdmin() && $owner->invited_by === null, 403);
        abort_if($user->id === $owner->id, 403);
        abort_if($user->invited_by !== $owner->id, 403);

        abort_unless($owner->canImpersonateEmployee(), 403);

        $request->session()->put('impersonate_admin_id', $owner->id);
        Auth::login($user);

        return redirect()->route('dashboard');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
