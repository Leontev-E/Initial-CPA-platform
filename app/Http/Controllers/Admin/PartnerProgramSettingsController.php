<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PartnerProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PartnerProgramSettingsController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user?->isPartnerAdmin(), 403);
        abort_if($user->invited_by !== null, 403); // только владелец ПП
        abort_if(!$user->partner_program_id, 403);

        $partnerProgram = PartnerProgram::withoutGlobalScopes()->findOrFail($user->partner_program_id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('partner_programs', 'slug')->ignore($partnerProgram->id),
            ],
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $partnerProgram->update($data);

        return back()->with('success', 'Название партнерской программы обновлено');
    }
}
