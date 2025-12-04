<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeadWebhook;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeadWebhookController extends Controller
{
    public function index(Request $request)
    {
        $webhooks = LeadWebhook::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return Inertia::render('Admin/Webhooks/Index', [
            'webhooks' => $webhooks,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['user_id'] = $request->user()->id;

        LeadWebhook::create($data);

        return back()->with('success', 'Вебхук добавлен');
    }

    public function update(Request $request, LeadWebhook $webhook)
    {
        $this->authorizeWebhook($request, $webhook);

        $data = $this->validateData($request);

        $webhook->update($data);

        return back()->with('success', 'Вебхук обновлен');
    }

    public function destroy(Request $request, LeadWebhook $webhook)
    {
        $this->authorizeWebhook($request, $webhook);
        $webhook->delete();

        return back()->with('success', 'Вебхук удален');
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
            'statuses' => ['array'],
            'statuses.*' => ['in:new,in_work,sale,cancel,trash'],
            'fields' => ['array'],
            'fields.*' => ['string'],
            'is_active' => ['boolean'],
        ], [
            'name.required' => 'Укажите название',
            'url.required' => 'Укажите URL',
            'url.url' => 'Некорректный URL',
            'statuses.*.in' => 'Недопустимый статус',
        ]);
    }

    protected function authorizeWebhook(Request $request, LeadWebhook $webhook): void
    {
        if ($webhook->user_id !== $request->user()->id) {
            abort(403);
        }
    }
}
