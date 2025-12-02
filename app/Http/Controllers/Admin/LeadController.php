<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStatusLog;
use App\Models\Offer;
use App\Models\OfferWebmasterRate;
use App\Models\PostbackSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function index(Request $request)
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
            $query->whereHas('offer', fn ($q) => $q->where('offer_category_id', $request->integer('category_id')));
        }

        $leads = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Admin/Leads/Index', [
            'leads' => $leads,
            'offers' => Offer::orderBy('name')->get(['id', 'name']),
            'webmasters' => User::where('role', User::ROLE_WEBMASTER)->orderBy('name')->get(['id', 'name', 'email']),
            'filters' => $request->only(['webmaster_id', 'offer_id', 'geo', 'status', 'date_from', 'date_to', 'category_id']),
        ]);
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:new,in_work,sale,cancel,trash'],
        ]);

        $fromStatus = $lead->status;
        $lead->status = $validated['status'];

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
        ]);

        $this->triggerPostback($lead);

        return back()->with('success', 'Статус лида обновлен');
    }

    protected function resolvePayout(Lead $lead): float
    {
        $custom = OfferWebmasterRate::where('offer_id', $lead->offer_id)
            ->where('webmaster_id', $lead->webmaster_id)
            ->value('custom_payout');

        return $custom ?? $lead->offer->default_payout;
    }

    protected function triggerPostback(Lead $lead): void
    {
        $event = match ($lead->status) {
            'sale' => 'sale',
            'cancel', 'trash' => 'trash',
            default => 'lead',
        };

        $settings = PostbackSetting::where('webmaster_id', $lead->webmaster_id)
            ->where('event', $event)
            ->where('is_active', true)
            ->get();

        foreach ($settings as $setting) {
            try {
                Http::timeout(3)->asForm()->post($setting->url, [
                    'lead_id' => $lead->id,
                    'status' => $lead->status,
                    'payout' => $lead->payout,
                    'offer_id' => $lead->offer_id,
                    'subid' => $lead->subid,
                    'geo' => $lead->geo,
                ]);
            } catch (\Throwable $e) {
                // swallow errors for MVP
            }
        }
    }
}
