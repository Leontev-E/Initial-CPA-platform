<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStatusLog;
use App\Models\Offer;
use App\Models\OfferWebmasterRate;
use App\Models\User;
use App\Services\PostbackDispatcher;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function __construct(private readonly PostbackDispatcher $postbackDispatcher)
    {
    }

    public function index(Request $request)
    {
        $query = $this->baseQuery($request);

        $leads = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Admin/Leads/Index', [
            'leads' => $leads,
            'offers' => Offer::orderBy('name')->get(['id', 'name']),
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)->orderBy('name')->get(['id', 'name', 'email']),
            'filters' => $request->only(['webmaster_id', 'offer_id', 'geo', 'status', 'date_from', 'date_to', 'category_id']),
        ]);
    }

    public function export(Request $request)
    {
        $query = $this->baseQuery($request)->orderByDesc('created_at');

        $callback = function () use ($query) {
            $stream = fopen('php://output', 'w');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, [
                'ID', 'Дата', 'Вебмастер', 'Оффер', 'GEO', 'Статус', 'Payout',
                'SubID', 'Имя', 'Телефон', 'Email', 'Landing URL', 'UTM Source', 'UTM Campaign', 'UTM Medium', 'UTM Term', 'UTM Content',
            ]);

            $query->chunkById(500, function ($chunk) use ($stream) {
                foreach ($chunk as $lead) {
                    fputcsv($stream, [
                        $lead->id,
                        optional($lead->created_at)->format('Y-m-d H:i:s'),
                        $lead->webmaster?->name,
                        $lead->offer?->name,
                        $lead->geo,
                        $lead->status,
                        $lead->payout,
                        $lead->subid,
                        $lead->customer_name,
                        $lead->customer_phone,
                        $lead->customer_email,
                        $lead->landing_url,
                        $lead->utm_source,
                        $lead->utm_campaign,
                        $lead->utm_medium,
                        $lead->utm_term,
                        $lead->utm_content,
                    ]);
                }
            });

            fclose($stream);
        };

        return response()->streamDownload($callback, 'leads.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function show(Lead $lead)
    {
        $lead->load(['offer.categories', 'webmaster', 'statusLogs.user']);

        return Inertia::render('Admin/Leads/Show', [
            'lead' => $lead,
            'statuses' => [
                ['value' => 'new', 'label' => 'Новый'],
                ['value' => 'in_work', 'label' => 'В работе'],
                ['value' => 'sale', 'label' => 'Продажа'],
                ['value' => 'cancel', 'label' => 'Отмена'],
                ['value' => 'trash', 'label' => 'Треш'],
            ],
        ]);
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:new,in_work,sale,cancel,trash'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:255'],
            'customer_email' => ['nullable', 'string', 'max:255'],
            'shipping_address' => ['nullable', 'string', 'max:500'],
        ]);

        $fromStatus = $lead->status;
        $lead->status = $validated['status'];

        if ($request->filled('customer_name')) {
            $lead->customer_name = $request->string('customer_name')->toString();
        }
        if ($request->filled('customer_phone')) {
            $lead->customer_phone = $request->string('customer_phone')->toString();
        }
        if ($request->filled('customer_email')) {
            $lead->customer_email = $request->string('customer_email')->toString();
        }
        if ($request->filled('shipping_address')) {
            $lead->shipping_address = $request->string('shipping_address')->toString();
        }

        if ($request->filled('comment')) {
            $lead->comment = $request->string('comment')->toString();
        }

        if ($lead->status === 'sale') {
            $lead->payout = $this->resolvePayout($lead);
        }

        if (in_array($lead->status, ['cancel', 'trash'])) {
            $lead->payout = 0;
        }

        $lead->save();

        LeadStatusLog::create([
            'lead_id' => $lead->id,
            'user_id' => $request->user()->id,
            'from_status' => $fromStatus,
            'to_status' => $lead->status,
            'comment' => $request->string('comment')->toString(),
        ]);

        $this->postbackDispatcher->dispatch($lead, $fromStatus);

        return back()->with('success', 'Статус лида обновлён');
    }

    protected function resolvePayout(Lead $lead): float
    {
        $custom = OfferWebmasterRate::where('offer_id', $lead->offer_id)
            ->where('webmaster_id', $lead->webmaster_id)
            ->value('custom_payout');

        return $custom ?? $lead->offer->default_payout;
    }

    protected function baseQuery(Request $request)
    {
        $query = Lead::query()->with(['offer.category', 'webmaster']);

        if ($request->filled('webmaster_id')) {
            $query->where('webmaster_id', $request->integer('webmaster_id'));
        }

        if ($request->filled('offer_id')) {
            $query->where('offer_id', $request->integer('offer_id'));
        }

        if ($request->filled('geo')) {
            $query->where('geo', strtoupper($request->string('geo')->toString()));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        if ($request->filled('category_id')) {
            $query->whereHas('offer', fn($q) => $q->where('offer_category_id', $request->integer('category_id')));
        }

        return $query;
    }

}
