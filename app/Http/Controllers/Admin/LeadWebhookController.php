<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeadWebhook;
use App\Models\LeadWebhookLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LeadWebhookController extends Controller
{
    public function index(Request $request)
    {
        $webhooks = LeadWebhook::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        $logs = LeadWebhookLog::with('webhook:id,name')
            ->where('direction', 'outgoing')
            ->where('user_id', $request->user()->id)
            ->where('created_at', '>=', now()->subDays(10))
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = $request->string('search')->toString();
                $query->where(function ($q) use ($term) {
                    $q->where('url', 'like', "%{$term}%")
                        ->orWhere('event', 'like', "%{$term}%")
                        ->orWhere('status_code', 'like', "%{$term}%")
                        ->orWhere('lead_id', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('event'), fn($q) => $q->where('event', $request->string('event')->toString()))
            ->when($request->filled('webhook_id'), fn($q) => $q->where('webhook_id', $request->integer('webhook_id')))
            ->when($request->filled('result'), function ($q) use ($request) {
                $res = $request->string('result')->toString();
                if ($res === 'ok') {
                    $q->whereNull('error_message');
                } elseif ($res === 'error') {
                    $q->whereNotNull('error_message');
                }
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $incomingFilters = [
            'search' => $request->query('incoming_search'),
            'result' => $request->query('incoming_result'),
            'lead_id' => $request->query('incoming_lead_id'),
        ];

        $incomingLogs = LeadWebhookLog::query()
            ->where('direction', 'incoming')
            ->where('user_id', $request->user()->id)
            ->where('created_at', '>=', now()->subDays(10))
            ->when($incomingFilters['search'], function ($query) use ($incomingFilters) {
                $term = (string) $incomingFilters['search'];
                $driver = DB::connection()->getDriverName();
                $payloadColumn = $driver === 'pgsql' ? 'payload::text' : 'payload';
                $like = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
                $query->where(function ($q) use ($term, $payloadColumn, $like) {
                    $q->where('url', 'like', "%{$term}%")
                        ->orWhere('status_before', 'like', "%{$term}%")
                        ->orWhere('status_after', 'like', "%{$term}%")
                        ->orWhereRaw("CAST({$payloadColumn} AS TEXT) {$like} ?", ["%{$term}%"]);
                });
            })
            ->when($incomingFilters['lead_id'], fn($q) => $q->where('lead_id', $incomingFilters['lead_id']))
            ->when($incomingFilters['result'], function ($q) use ($incomingFilters) {
                if ($incomingFilters['result'] === 'ok') {
                    $q->whereNull('error_message');
                } elseif ($incomingFilters['result'] === 'error') {
                    $q->whereNotNull('error_message');
                }
            })
            ->orderByDesc('created_at')
            ->paginate(20, ['*'], 'incoming_page')
            ->withQueryString();

        return Inertia::render('Admin/Webhooks/Index', [
            'webhooks' => $webhooks,
            'logs' => $logs,
            'webhookOptions' => $webhooks->map(fn($hook) => ['id' => $hook->id, 'name' => $hook->name]),
            'filters' => [
                'search' => $request->query('search'),
                'event' => $request->query('event'),
                'result' => $request->query('result'),
                'webhook_id' => $request->query('webhook_id'),
            ],
            'incoming' => [
                'url' => route('api.webhooks.leads.status'),
                'token' => $request->user()->incoming_webhook_token,
                'logs' => $incomingLogs,
                'filters' => $incomingFilters,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['user_id'] = $request->user()->id;
        $data['partner_program_id'] = app(\App\Support\PartnerProgramContext::class)->getPartnerProgramId() ?? $request->user()->partner_program_id;

        LeadWebhook::create($data);

        return back()->with('success', 'Вебхук добавлен');
    }

    public function update(Request $request, LeadWebhook $webhook)
    {
        $this->authorizeWebhook($request, $webhook);

        $data = $this->validateData($request);
        $data['partner_program_id'] = $webhook->partner_program_id;

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
            'method' => ['required', 'in:get,post'],
            'statuses' => ['array'],
            'statuses.*' => ['in:new,in_work,sale,cancel,trash'],
            'fields' => ['array'],
            'fields.*' => ['string'],
            'is_active' => ['boolean'],
        ], [
            'name.required' => 'Укажите название',
            'url.required' => 'Укажите URL',
            'url.url' => 'Некорректный URL',
            'method.required' => 'Укажите метод отправки',
            'method.in' => 'Метод должен быть GET или POST',
            'statuses.*.in' => 'Недопустимый статус',
        ]);
    }

    protected function authorizeWebhook(Request $request, LeadWebhook $webhook): void
    {
        if ($webhook->user_id !== $request->user()->id) {
            abort(403);
        }
    }

    public function regenerateIncomingToken(Request $request)
    {
        $request->user()->update([
            'incoming_webhook_token' => Str::random(48),
        ]);

        return back()->with('success', 'Токен обновлен');
    }
}
