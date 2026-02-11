<?php

namespace Tests\Feature;

use App\Contracts\GeoIpResolver;
use App\Models\ApiKey;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiLeadGeoDetectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
    }

    public function test_geo_is_detected_from_ip_when_geo_is_not_provided(): void
    {
        $this->bindGeoResolver('DE');
        ['offer' => $offer, 'apiKey' => $apiKey] = $this->createApiFixture();

        $response = $this->postJson('/api/leads', [
            'offer_id' => $offer->id,
            'ip' => '8.8.8.8',
            'customer_name' => 'John Doe',
            'customer_phone' => '+79990000000',
        ], [
            'X-API-KEY' => $apiKey->key,
        ]);

        $response->assertOk()->assertJson(['status' => 'ok']);

        $lead = Lead::query()->latest('id')->first();
        $this->assertNotNull($lead);
        $this->assertSame('DE', $lead->geo);
        $this->assertSame('8.8.8.8', $lead->ip);
        $this->assertSame('DE', data_get($lead->extra_data, '_detected_geo'));
        $this->assertSame('8.8.8.8', data_get($lead->extra_data, '_detected_geo_ip'));
    }

    public function test_submitted_geo_is_kept_by_default_and_detected_geo_is_saved_to_extra_data(): void
    {
        $this->bindGeoResolver('DE');
        ['offer' => $offer, 'apiKey' => $apiKey] = $this->createApiFixture();

        $response = $this->postJson('/api/leads', [
            'offer_id' => $offer->id,
            'geo' => 'ru',
            'ip' => '8.8.8.8',
            'customer_name' => 'John Doe',
            'customer_phone' => '+79990000000',
        ], [
            'X-API-KEY' => $apiKey->key,
        ]);

        $response->assertOk()->assertJson(['status' => 'ok']);

        $lead = Lead::query()->latest('id')->first();
        $this->assertNotNull($lead);
        $this->assertSame('RU', $lead->geo);
        $this->assertSame('DE', data_get($lead->extra_data, '_detected_geo'));
        $this->assertSame('RU', data_get($lead->extra_data, '_submitted_geo'));
    }

    public function test_request_fails_when_geo_is_missing_and_cannot_be_detected_from_ip(): void
    {
        $this->bindGeoResolver(null);
        ['offer' => $offer, 'apiKey' => $apiKey] = $this->createApiFixture();

        $response = $this->postJson('/api/leads', [
            'offer_id' => $offer->id,
            'ip' => '8.8.8.8',
            'customer_name' => 'John Doe',
            'customer_phone' => '+79990000000',
        ], [
            'X-API-KEY' => $apiKey->key,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('geo');
        $this->assertDatabaseCount('leads', 0);
    }

    private function createApiFixture(): array
    {
        $webmaster = User::factory()->create([
            'role' => User::ROLE_WEBMASTER,
            'is_active' => true,
            'partner_program_id' => 1,
        ]);

        $category = OfferCategory::create([
            'partner_program_id' => 1,
            'name' => 'Category',
            'slug' => Str::uuid()->toString(),
            'is_active' => true,
        ]);

        $offer = Offer::create([
            'partner_program_id' => 1,
            'offer_category_id' => $category->id,
            'name' => 'Offer',
            'slug' => Str::uuid()->toString(),
            'default_payout' => 100,
            'allowed_geos' => ['RU', 'DE'],
            'is_active' => true,
        ]);

        $apiKey = ApiKey::create([
            'partner_program_id' => 1,
            'webmaster_id' => $webmaster->id,
            'key' => 'test-api-key',
            'is_active' => true,
        ]);

        return compact('offer', 'apiKey');
    }

    private function bindGeoResolver(?string $countryCode): void
    {
        $this->app->instance(GeoIpResolver::class, new class($countryCode) implements GeoIpResolver
        {
            public function __construct(private readonly ?string $countryCode)
            {
            }

            public function resolveCountryCode(?string $ip): ?string
            {
                return $this->countryCode;
            }
        });
    }
}
