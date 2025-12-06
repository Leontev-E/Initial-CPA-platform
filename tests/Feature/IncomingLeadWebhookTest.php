<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class IncomingLeadWebhookTest extends TestCase
{
    use RefreshDatabase;

    private function createLeadFixture(User $webmaster): Lead
    {
        $category = OfferCategory::create([
            'name' => 'Cat',
            'slug' => 'cat',
        ]);

        $offer = Offer::create([
            'offer_category_id' => $category->id,
            'name' => 'Offer',
            'slug' => Str::uuid(),
            'default_payout' => 100,
            'allowed_geos' => ['RU'],
        ]);

        return Lead::create([
            'offer_id' => $offer->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'RU',
            'status' => 'new',
            'payout' => 100,
            'customer_name' => 'John',
            'customer_phone' => '+1000',
            'customer_email' => 'john@example.com',
        ]);
    }

    public function test_successful_incoming_webhook_updates_status_and_logs(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'incoming_webhook_token' => 'secret-token',
        ]);
        $lead = $this->createLeadFixture(User::factory()->create());

        $response = $this->postJson('/api/webhooks/leads/status', [
            'lead_id' => $lead->id,
            'status' => 'sale',
            'comment' => 'Confirmed',
            'token' => 'secret-token',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'lead_id' => $lead->id,
                'old_status' => 'new',
                'new_status' => 'sale',
            ]);

        $lead->refresh();
        $this->assertSame('sale', $lead->status);
        $this->assertSame('Confirmed', $lead->comment);

        $this->assertDatabaseHas('lead_webhook_logs', [
            'direction' => 'incoming',
            'lead_id' => $lead->id,
            'status_before' => 'new',
            'status_after' => 'sale',
            'error_message' => null,
            'user_id' => $admin->id,
        ]);
    }

    public function test_invalid_token_returns_unauthorized(): void
    {
        $this->postJson('/api/webhooks/leads/status', [
            'lead_id' => 1,
            'status' => 'sale',
        ])->assertStatus(401);
    }

    public function test_invalid_status_returns_validation_error_and_logs(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'incoming_webhook_token' => 'secret-token',
        ]);
        $lead = $this->createLeadFixture(User::factory()->create());

        $response = $this->postJson('/api/webhooks/leads/status', [
            'lead_id' => $lead->id,
            'status' => 'bad',
            'token' => 'secret-token',
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseHas('lead_webhook_logs', [
            'direction' => 'incoming',
            'lead_id' => $lead->id,
            'status_code' => 422,
        ]);
    }

    public function test_not_found_lead_is_logged_and_returns_404(): void
    {
        User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'incoming_webhook_token' => 'secret-token',
        ]);

        $response = $this->postJson('/api/webhooks/leads/status', [
            'lead_id' => 9999,
            'status' => 'sale',
            'token' => 'secret-token',
        ]);

        $response->assertStatus(404);

        $this->assertDatabaseHas('lead_webhook_logs', [
            'direction' => 'incoming',
            'lead_id' => 9999,
            'status_code' => 404,
        ]);
    }
}
