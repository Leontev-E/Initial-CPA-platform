<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PartnerProgram;
use App\Models\User;
use App\Support\PartnerProgramContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PartnerProgramController extends Controller
{
    public function index(Request $request)
    {
        $programs = PartnerProgram::withCount([
            'offers as offers_count' => fn($q) => $q->withoutGlobalScopes(),
            'webmasters as webmasters_count' => fn($q) => $q->withoutGlobalScopes()->where('role', User::ROLE_WEBMASTER),
        ])
            ->with([
                'owner' => fn($q) => $q->withoutGlobalScopes()
                    ->select('id', 'partner_program_id', 'name', 'telegram', 'email'),
            ])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SuperAdmin/PartnerPrograms/Index', [
            'programs' => $programs,
            'currentPartnerProgramId' => $request->session()->get('partner_program_id'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SuperAdmin/PartnerPrograms/Form', [
            'program' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);

        $program = PartnerProgram::create($data);

        return redirect()->route('super-admin.partner-programs.index')->with('success', 'Партнерская программа создана');
    }

    public function edit(PartnerProgram $partnerProgram)
    {
        return Inertia::render('SuperAdmin/PartnerPrograms/Form', [
            'program' => $partnerProgram,
        ]);
    }

    public function update(Request $request, PartnerProgram $partnerProgram)
    {
        $data = $this->validatedData($request, $partnerProgram->id);
        $partnerProgram->update($data);

        return redirect()->route('super-admin.partner-programs.index')->with('success', 'Партнерская программа обновлена');
    }

    public function switch(PartnerProgram $partnerProgram, Request $request)
    {
        $request->session()->put('partner_program_id', $partnerProgram->id);
        app(PartnerProgramContext::class)->setPartnerProgram($partnerProgram);

        return redirect()->route('admin.dashboard')->with('success', 'Контекст переключен на '.$partnerProgram->name);
    }

    public function resetContext(Request $request)
    {
        $request->session()->forget('partner_program_id');
        app(PartnerProgramContext::class)->clear();

        return redirect()->route('super-admin.partner-programs.index')->with('success', 'Контекст сброшен');
    }

    protected function validatedData(Request $request, ?int $id = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('partner_programs', 'slug')->ignore($id),
            ],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'domain' => ['nullable', 'string', 'max:255'],
            'offer_limit' => ['nullable', 'integer', 'min:0'],
            'webmaster_limit' => ['nullable', 'integer', 'min:0'],
            'is_unlimited' => ['boolean'],
            'is_blocked' => ['boolean'],
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        return $data;
    }
}
