<?php

namespace Database\Seeders;

use App\Models\ApiKey;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferCategory;
use App\Models\OfferWebmasterRate;
use App\Models\PostbackSetting;
use App\Models\PayoutRequest;
use App\Models\User;
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
        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@cpa.test',
            'telegram' => 'admin_boostclicks',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
        ]);

        $webmaster = User::factory()->create([
            'name' => 'Webmaster',
            'email' => 'webmaster@cpa.test',
            'telegram' => 'webmaster_boost',
            'password' => 'password',
            'role' => User::ROLE_WEBMASTER,
        ]);

        $category = OfferCategory::create([
            'name' => 'Финансы',
            'slug' => 'finance',
            'description' => 'Кредиты и микрозаймы',
        ]);

        $offer1 = Offer::create([
            'offer_category_id' => $category->id,
            'name' => 'Кредит онлайн',
            'slug' => 'credit-online',
            'default_payout' => 25.50,
            'allowed_geos' => ['RU', 'UA', 'KZ'],
            'description' => 'Онлайн-оформление кредита с быстрым одобрением.',
            'notes' => 'Внутренний комментарий для админа.',
            'is_active' => true,
        ]);

        $offer2 = Offer::create([
            'offer_category_id' => $category->id,
            'name' => 'Страхование авто',
            'slug' => 'car-insurance',
            'default_payout' => 18.00,
            'allowed_geos' => ['RU', 'KZ'],
            'description' => 'Оформление страховки ОСАГО и КАСКО.',
            'notes' => 'Приоритетный оффер для РФ.',
            'is_active' => true,
        ]);

        OfferWebmasterRate::create([
            'offer_id' => $offer1->id,
            'webmaster_id' => $webmaster->id,
            'custom_payout' => 30.00,
        ]);

        $leadNew = Lead::create([
            'offer_id' => $offer1->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'RU',
            'status' => 'new',
            'payout' => null,
            'customer_name' => 'Иван Иванов',
            'customer_phone' => '+79999999999',
            'customer_email' => 'lead1@example.com',
            'subid' => 'sub123',
            'ip' => '127.0.0.1',
            'user_agent' => 'Seeder UA',
            'utm_source' => 'facebook',
            'utm_campaign' => 'launch',
        ]);

        $leadSale = Lead::create([
            'offer_id' => $offer1->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'RU',
            'status' => 'sale',
            'payout' => 30.00,
            'customer_name' => 'Петр Петров',
            'customer_phone' => '+78888888888',
            'customer_email' => 'lead2@example.com',
            'subid' => 'sub124',
            'ip' => '127.0.0.2',
            'user_agent' => 'Seeder UA',
            'utm_source' => 'google',
            'utm_campaign' => 'brand',
        ]);

        $leadCancel = Lead::create([
            'offer_id' => $offer2->id,
            'webmaster_id' => $webmaster->id,
            'geo' => 'KZ',
            'status' => 'cancel',
            'payout' => 0,
            'customer_name' => 'Сергей Сергеев',
            'customer_phone' => '+77777777777',
            'customer_email' => 'lead3@example.com',
            'subid' => 'sub125',
            'ip' => '127.0.0.3',
            'user_agent' => 'Seeder UA',
            'utm_source' => 'tiktok',
            'utm_campaign' => 'test',
        ]);

        ApiKey::create([
            'webmaster_id' => $webmaster->id,
            'key' => Str::uuid()->toString(),
        ]);

        PostbackSetting::create([
            'webmaster_id' => $webmaster->id,
            'event' => 'lead',
            'url' => 'https://openai-book.store/postback/lead',
        ]);

        PayoutRequest::create([
            'webmaster_id' => $webmaster->id,
            'amount' => 100,
            'status' => 'pending',
            'method' => 'USDT TRC20',
            'details' => 'TRC20 wallet: TGxxx',
        ]);
    }
}
