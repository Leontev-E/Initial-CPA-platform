<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Offer;
use App\Models\OfferWebmasterRate;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OfferController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $perPage = in_array((int) $request->input('per_page'), [12, 24, 48], true) ? (int) $request->input('per_page') : 12;
        $search = $request->string('search')->toString();
        $categoryId = $request->integer('category_id');
        $geoFilters = array_filter(array_map('trim', (array) $request->input('geos', [])));

        $query = Offer::where('is_active', true)
            ->whereHas('category', fn ($q) => $q->where('is_active', true))
            ->whereDoesntHave('categories', fn ($q) => $q->where('is_active', false))
            ->with(['category', 'categories'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('id', $search);
                });
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where(function ($sub) use ($categoryId) {
                    $sub->where('offer_category_id', $categoryId)
                        ->orWhereHas('categories', fn ($c) => $c->where('offer_category_id', $categoryId));
                });
            })
            ->when(!empty($geoFilters), function ($q) use ($geoFilters) {
                $q->where(function ($sub) use ($geoFilters) {
                    foreach ($geoFilters as $geo) {
                        $sub->orWhereJsonContains('allowed_geos', strtoupper($geo));
                    }
                });
            })
            ->orderBy('name');

        $offers = $query->paginate($perPage)->withQueryString()->through(function (Offer $offer) use ($user) {
            $custom = OfferWebmasterRate::where('offer_id', $offer->id)
                ->where('webmaster_id', $user->id)
                ->value('custom_payout');
            $offer->effective_payout = $custom ?? $offer->default_payout;
            return $offer;
        });

        return Inertia::render('Webmaster/Offers/Index', [
            'offers' => $offers,
            'filters' => $request->only(['search', 'category_id', 'geos', 'per_page']),
            'categories' => \App\Models\OfferCategory::orderBy('name')->get(['id', 'name']),
            'geos' => \App\Models\Offer::select('allowed_geos')->whereNotNull('allowed_geos')->get()->pluck('allowed_geos')->flatten()->unique()->values(),
        ]);
    }

    public function show(Request $request, Offer $offer)
    {
        $user = $request->user();
        $custom = OfferWebmasterRate::where('offer_id', $offer->id)
            ->where('webmaster_id', $user->id)
            ->value('custom_payout');

        $offer->load(['category', 'categories', 'landings']);
        $offer->effective_payout = $custom ?? $offer->default_payout;

        $apiKey = ApiKey::firstOrCreate(
            ['webmaster_id' => $user->id, 'is_active' => true],
            ['key' => Str::uuid()->toString()]
        );

        return Inertia::render('Webmaster/Offers/Show', [
            'offer' => $offer,
            'apiKey' => $apiKey,
        ]);
    }

    public function downloadApiScript(Request $request, Offer $offer)
    {
        $user = $request->user();

        $apiKey = ApiKey::firstOrCreate(
            ['webmaster_id' => $user->id, 'is_active' => true],
            ['key' => Str::uuid()->toString()]
        );

        $allowedGeos = array_filter((array) $offer->allowed_geos ?? []);
        $geo = trim((string) $request->get('geo', ''));
        if (! empty($allowedGeos)) {
            if ($geo === '' || ! in_array($geo, $allowedGeos, true)) {
                $geo = $allowedGeos[0];
            }
        }

        $appUrl = rtrim(config('app.url'), '/');

        $content = <<<PHP
<?php

// API ключ вебмастера
\$apiToken = '{$apiKey->key}';

// ====== Антидубль по телефону ======
function isDuplicateLead(\$phone)
{
    \$file = 'leads.txt';

    if (!file_exists(\$file)) {
        file_put_contents(\$file, '');
    }

    \$leads = file_get_contents(\$file);
    \$escapedPhone = preg_quote(\$phone, '/');
    \$phonePattern = '/' . \$escapedPhone . "\\n/";

    if (preg_match(\$phonePattern, \$leads)) {
        return true;
    } else {
        file_put_contents(\$file, \$phone . "\\n", FILE_APPEND);
        return false;
    }
}

function cleanPhoneNumber(\$phoneNumber)
{
    return preg_replace('/[^0-9]/', '', \$phoneNumber);
}

// Чистим номер и проверяем на дубликат
\$rawPhone    = \$_POST['phone'] ?? '';
\$cleanedPhone = cleanPhoneNumber(\$rawPhone);

if (isDuplicateLead(\$cleanedPhone)) {
    header('Location: error.php?name=' . urlencode(\$_POST['firstname'] ?? '') . '&phone=' . urlencode(\$rawPhone));
    exit;
}

// ====== Подготовка данных для новой партнёрки ======

\$url      = '{$appUrl}/api/leads';
\$ip       = \$_SERVER['REMOTE_ADDR'] ?? '';
\$referer  = \$_SERVER['HTTP_REFERER'] ?? 'direct';
\$language = isset(\$_SERVER['HTTP_ACCEPT_LANGUAGE']) ? substr(\$_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) : 'unknown';

\$scheme      = (!empty(\$_SERVER['HTTPS']) && \$_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
\$landingUrl  = \$scheme . '://' . (\$_SERVER['HTTP_HOST'] ?? '') . (\$_SERVER['REQUEST_URI'] ?? '/');

\$offerId = {$offer->id};

\$payload = [
    'offer_id'       => \$offerId,
    'geo'            => \$_POST['country'] ?? \$_POST['geo'] ?? '{$geo}',
    'customer_name'  => \$_POST['name'] ?? (\$_POST['firstname'] ?? ''),
    'customer_phone' => \$rawPhone,
    'customer_email' => \$_POST['email'] ?? null,
    'subid'          => \$_POST['sub1'] ?? null,
    'landing_url'    => \$landingUrl,
    'utm_source'     => \$_POST['utm_source'] ?? null,
    'utm_medium'     => \$_POST['utm_medium'] ?? null,
    'utm_campaign'   => \$_POST['utm_campaign'] ?? null,
    'utm_term'       => \$_POST['utm_term'] ?? null,
    'utm_content'    => \$_POST['utm_content'] ?? null,
    'tags' => [
        'sub2'      => \$_POST['sub2'] ?? null,
        'sub3'      => \$_POST['sub3'] ?? null,
        'sub4'      => \$_POST['sub4'] ?? null,
        'sub5'      => \$_POST['sub5'] ?? null,
        'ip'        => \$ip,
        'referer'   => \$referer,
        'language'  => \$language,
        'is_mobile' => \$_POST['is_mobile'] ?? null,
        'ua'        => \$_SERVER['HTTP_USER_AGENT'] ?? null,
    ],
];

\$payload['tags'] = array_filter(
    \$payload['tags'],
    static function (\$value) {
        return \$value !== null && \$value !== '';
    }
);

foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as \$utmKey) {
    if (!isset(\$payload[\$utmKey]) || \$payload[\$utmKey] === '') {
        unset(\$payload[\$utmKey]);
    }
}

\$ch = curl_init();
curl_setopt(\$ch, CURLOPT_URL, \$url);
curl_setopt(\$ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt(\$ch, CURLOPT_POST, true);
curl_setopt(\$ch, CURLOPT_POSTFIELDS, json_encode(\$payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
curl_setopt(\$ch, CURLOPT_HTTPHEADER, [
    'X-API-KEY: ' . \$apiToken,
    'Content-Type: application/json',
    'Accept: application/json',
]);
curl_setopt(\$ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt(\$ch, CURLOPT_TIMEOUT, 20);

\$response  = curl_exec(\$ch);
\$curlError = curl_error(\$ch);
\$httpCode  = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);

curl_close(\$ch);

if (\$curlError) {
    echo 'Curl error: ' . htmlspecialchars(\$curlError, ENT_QUOTES, 'UTF-8');
    exit;
}

\$responseArr = json_decode(\$response, true);

if (\$httpCode === 200 && is_array(\$responseArr) && (\$responseArr['status'] ?? null) === 'ok') {
    header('Location: success.php?name=' . urlencode(\$_POST['name'] ?? '') . '&phone=' . urlencode(\$rawPhone));
    exit;
} else {
    \$message = \$responseArr['message'] ?? ('Request failed, HTTP code: ' . \$httpCode);
    echo htmlspecialchars(\$message, ENT_QUOTES, 'UTF-8');
}
PHP;

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, 'api.php', [
            'Content-Type' => 'application/x-php',
        ]);
    }
}
