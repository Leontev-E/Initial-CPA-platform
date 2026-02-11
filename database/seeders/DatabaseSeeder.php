<?php

namespace Database\Seeders;

use App\Models\ApiKey;
use App\Models\BalanceAdjustment;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferCategory;
use App\Models\OfferWebmasterRate;
use App\Models\PartnerProgram;
use App\Models\PostbackSetting;
use App\Models\PayoutRequest;
use App\Models\User;
use App\Support\PartnerProgramContext;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $defaultSeedPassword = env('SEED_DEFAULT_PASSWORD', 'ChangeMe123!');

        $this->call(SuperAdminSeeder::class);

        $context = app(PartnerProgramContext::class);

        $defaultProgram = PartnerProgram::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Default CPA',
                'slug' => 'default-cpa',
                'contact_email' => 'owner@cpa.test',
                'status' => 'active',
            ]
        );

        $secondProgram = PartnerProgram::firstOrCreate(
            ['slug' => 'second-cpa'],
            [
                'name' => 'Second CPA',
                'contact_email' => 'owner2@cpa.test',
                'status' => 'active',
            ]
        );

        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'owner@platform.test',
            'telegram' => '@super_owner',
            'password' => $defaultSeedPassword,
            'role' => User::ROLE_SUPER_ADMIN,
            'partner_program_id' => null,
        ]);

        $context->setPartnerProgram($defaultProgram);

        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@cpa.test',
            'telegram' => '@admin_boostclicks',
            'password' => $defaultSeedPassword,
            'role' => User::ROLE_ADMIN,
            'partner_program_id' => $defaultProgram->id,
        ]);

        $webmaster = User::factory()->create([
            'name' => 'Webmaster',
            'email' => 'webmaster@cpa.test',
            'telegram' => '@webmaster_boost',
            'password' => $defaultSeedPassword,
            'role' => User::ROLE_WEBMASTER,
            'partner_program_id' => $defaultProgram->id,
        ]);

        $category = OfferCategory::create([
            'partner_program_id' => $defaultProgram->id,
            'name' => 'Finance',
            'slug' => 'finance',
            'description' => 'Loans, cards and banking services.',
        ]);

        $offer1 = Offer::create([
            'partner_program_id' => $defaultProgram->id,
            'offer_category_id' => $category->id,
            'name' => 'Credit Online',
            'slug' => 'credit-online',
            'default_payout' => 25.50,
            'allowed_geos' => ['RU', 'UA', 'KZ'],
            'description' => 'Fast credit approvals with online onboarding.',
            'notes' => 'Deliver only qualified leads with valid phone numbers.',
            'is_active' => true,
        ]);

        $offer2 = Offer::create([
            'partner_program_id' => $defaultProgram->id,
            'offer_category_id' => $category->id,
            'name' => 'Car Insurance',
            'slug' => 'car-insurance',
            'default_payout' => 18.00,
            'allowed_geos' => ['RU', 'KZ'],
            'description' => 'Insurance leads with phone verification.',
            'notes' => 'Keep subid for traffic source attribution.',
            'is_active' => true,
        ]);

        OfferWebmasterRate::create([
            'partner_program_id' => $defaultProgram->id,
            'offer_id' => $offer1->id,
            'webmaster_id' => $webmaster->id,
            'custom_payout' => 30.00,
        ]);

        Lead::create([
            'partner_program_id' => $defaultProgram->id,
            'offer_id' => $offer1->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'RU',
            'status' => 'new',
            'payout' => null,
            'customer_name' => 'Ivan Ivanov',
            'customer_phone' => '+79999999999',
            'customer_email' => 'lead1@example.com',
            'subid' => 'sub123',
            'ip' => '127.0.0.1',
            'user_agent' => 'Seeder UA',
            'utm_source' => 'facebook',
            'utm_campaign' => 'launch',
        ]);

        Lead::create([
            'partner_program_id' => $defaultProgram->id,
            'offer_id' => $offer1->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'RU',
            'status' => 'sale',
            'payout' => 30.00,
            'customer_name' => 'Petr Petrov',
            'customer_phone' => '+78888888888',
            'customer_email' => 'lead2@example.com',
            'subid' => 'sub124',
            'ip' => '127.0.0.2',
            'user_agent' => 'Seeder UA',
            'utm_source' => 'google',
            'utm_campaign' => 'brand',
        ]);

        Lead::create([
            'partner_program_id' => $defaultProgram->id,
            'offer_id' => $offer2->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'KZ',
            'status' => 'cancel',
            'payout' => 0,
            'customer_name' => 'Aigerim Daulet',
            'customer_phone' => '+77777777777',
            'customer_email' => 'lead3@example.com',
            'subid' => 'sub125',
            'ip' => '127.0.0.3',
            'user_agent' => 'Seeder UA',
            'utm_source' => 'tiktok',
            'utm_campaign' => 'test',
        ]);

        ApiKey::create([
            'partner_program_id' => $defaultProgram->id,
            'webmaster_id' => $webmaster->id,
            'key' => Str::uuid()->toString(),
        ]);

        PostbackSetting::create([
            'partner_program_id' => $defaultProgram->id,
            'webmaster_id' => $webmaster->id,
            'event' => 'lead',
            'url' => 'https://cpa.boostclicks.ru/postback/lead',
        ]);

        PayoutRequest::create([
            'partner_program_id' => $defaultProgram->id,
            'webmaster_id' => $webmaster->id,
            'amount' => 100,
            'status' => 'pending',
            'method' => 'USDT TRC20',
            'details' => 'TRC20 wallet: TGxxx',
        ]);

        BalanceAdjustment::create([
            'partner_program_id' => $defaultProgram->id,
            'webmaster_id' => $webmaster->id,
            'created_by' => $admin->id,
            'amount' => 15,
            'comment' => 'Welcome bonus',
        ]);

        // Minimal second program data set
        $context->setPartnerProgram($secondProgram);

        $secondAdmin = User::factory()->create([
            'name' => 'Second Admin',
            'email' => 'admin2@cpa.test',
            'telegram' => '@admin_second',
            'password' => $defaultSeedPassword,
            'role' => User::ROLE_ADMIN,
            'partner_program_id' => $secondProgram->id,
        ]);

        User::factory()->create([
            'name' => 'Second Webmaster',
            'email' => 'webmaster2@cpa.test',
            'telegram' => '@wm_second',
            'password' => $defaultSeedPassword,
            'role' => User::ROLE_WEBMASTER,
            'partner_program_id' => $secondProgram->id,
        ]);
    }
}
