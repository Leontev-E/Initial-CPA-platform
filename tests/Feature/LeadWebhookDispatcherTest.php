<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadWebhook;
use App\Models\LeadWebhookLog;
use App\Models\Offer;
use App\Models\OfferCategory;
use App\Models\User;
use App\Services\LeadWebhookDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LeadWebhookDispatcherTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake();
    }

    public function test_dispatches_get_webhook_and_logs_success(): void
    {
        [$lead, $webhook] = $this->makeLeadWithWebhook([
            'method' => 'get',
            'statuses' => ['new'],
            'url' => 'https://example.com/hook?subid={subid}&from={from_status}',
            'fields' => ['subid'],
        ], 'new');

        Http::fake(['https://example.com/*' => Http::response('OK', 200)]);

        app(LeadWebhookDispatcher::class)->dispatch($lead, null);

        Http::assertSent(function (Request $request) use ($lead) {
            return $request->method() === 'GET'
                && str_contains($request->url(), 'subid='.$lead->subid);
        });

        $this->assertDatabaseHas('lead_webhook_logs', [
            'webhook_id' => $webhook->id,
            'lead_id' => $lead->id,
            'event' => 'new',
            'method' => 'get',
            'status_code' => 200,
        ]);
    }

    public function test_respects_status_filter_and_passes_previous_status(): void
    {
        [$lead, $webhook] = $this->makeLeadWithWebhook([
            'method' => 'post',
            'statuses' => ['sale'],
            'url' => 'https://example.com/hook',
            'fields' => ['customer_phone'],
        ], 'sale');

        Http::fake(['https://example.com/*' => Http::response('OK', 202)]);

        app(LeadWebhookDispatcher::class)->dispatch($lead, 'new');

        Http::assertSent(function (Request $request) {
            return $request->method() === 'POST'
                && $request['status'] === 'sale'
                && $request['from_status'] === 'new';
        });

        $this->assertDatabaseHas('lead_webhook_logs', [
            'webhook_id' => $webhook->id,
            'lead_id' => $lead->id,
            'event' => 'sale',
            'method' => 'post',
            'status_code' => 202,
        ]);
    }

    private function makeLeadWithWebhook(array $webhookOverrides = [], string $leadStatus = 'sale'): array
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $webmaster = User::factory()->create(['role' => User::ROLE_WEBMASTER]);

        $category = OfferCategory::create([
            'name' => 'Loans',
            'slug' => 'loans',
            'description' => 'Loans',
            'is_active' => true,
        ]);

        $offer = Offer::create([
            'offer_category_id' => $category->id,
            'name' => 'Offer',
            'slug' => 'offer',
            'default_payout' => 10,
            'allowed_geos' => ['RU'],
            'description' => 'Test',
            'notes' => 'note',
            'is_active' => true,
        ]);

        $lead = Lead::create([
            'offer_id' => $offer->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'RU',
            'status' => $leadStatus,
            'payout' => 10,
            'customer_name' => 'Ivan',
            'customer_phone' => '+7000',
            'customer_email' => 'mail@test.com',
            'subid' => 'sub123',
            'landing_url' => 'https://landing.test',
        ]);

        $webhook = LeadWebhook::create(array_merge([
            'user_id' => $admin->id,
            'name' => 'Test Hook',
            'url' => 'https://example.com',
            'method' => 'post',
            'statuses' => null,
            'fields' => [],
            'is_active' => true,
        ], $webhookOverrides));

        return [$lead, $webhook];
    }
}
