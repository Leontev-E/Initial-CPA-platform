<?php

namespace App\Services\SmartLinks;

use App\Contracts\GeoIpResolver;
use App\Models\Offer;
use App\Models\SmartLink;
use App\Models\SmartLinkAssignment;
use App\Models\SmartLinkClick;
use App\Models\SmartLinkStream;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SmartLinkRouter
{
    public function __construct(private readonly GeoIpResolver $geoIpResolver)
    {
    }

    /**
     * Resolve a smart link request into a destination URL and persist click tracking record.
     *
     * @return array{click: SmartLinkClick, final_url: ?string}
     */
    public function resolveAndTrack(SmartLink $smartLink, Request $request): array
    {
        $smartLink->loadMissing([
            'streams.offer.landings',
            'streams.preset',
            'fallbackOffer.landings',
        ]);

        $requestIp = $request->ip();
        $geo = $requestIp ? $this->geoIpResolver->resolveCountryCode($requestIp) : null;
        $deviceType = $this->detectDeviceType((string) $request->userAgent());

        $assignment = $this->resolveAssignment($smartLink, $request);
        $webmaster = $assignment?->webmaster;
        $allowedOfferIds = $webmaster ? $this->resolveAllowedOfferIds($webmaster) : null;

        $rawQuery = (array) $request->query();
        $query = Arr::except($rawQuery, ['wm_token', 'wm_id', 'webmaster_id']);

        $activeStreams = $smartLink->streams
            ->where('is_active', true)
            ->filter(function (SmartLinkStream $stream) use ($allowedOfferIds) {
                if ($stream->target_url) {
                    return true;
                }

                if ($this->streamHasWeightedOffers($stream, $allowedOfferIds)) {
                    return true;
                }

                if (! $stream->offer?->is_active) {
                    return false;
                }

                if (is_array($allowedOfferIds)) {
                    return in_array((int) $stream->offer_id, $allowedOfferIds, true);
                }

                return true;
            })
            ->values();

        $matchedStreams = $activeStreams
            ->filter(fn (SmartLinkStream $stream) => $this->matchesRules($stream, $request, $geo, $deviceType))
            ->values();

        $selectedStream = null;
        $selectedOffer = null;
        $targetUrl = null;
        $matchedBy = null;
        $isFallback = false;

        $canRouteWithoutAssignment = $smartLink->is_public || $assignment !== null;

        if ($canRouteWithoutAssignment && $matchedStreams->isNotEmpty()) {
            $selectedStream = $this->pickWeighted($this->highestPrioritySubset($matchedStreams));
            if ($selectedStream) {
                ['target_url' => $targetUrl, 'offer' => $selectedOffer] = $this->resolveTargetForStream($selectedStream, $allowedOfferIds);
                $matchedBy = 'rules';
            }
        }

        if ($canRouteWithoutAssignment && ! $targetUrl && $smartLink->fallback_url) {
            $targetUrl = $smartLink->fallback_url;
            $selectedOffer = null;
            $matchedBy = 'fallback_url';
            $isFallback = true;
        }

        if ($canRouteWithoutAssignment && ! $targetUrl && $smartLink->fallbackOffer) {
            $fallbackAllowed = ! is_array($allowedOfferIds)
                || in_array((int) $smartLink->fallbackOffer->id, $allowedOfferIds, true);

            if ($fallbackAllowed) {
                $targetUrl = $this->buildTargetUrlFromOffer($smartLink->fallbackOffer);
                if ($targetUrl) {
                    $selectedOffer = $smartLink->fallbackOffer;
                    $matchedBy = 'fallback_offer';
                    $isFallback = true;
                }
            }
        }

        if ($canRouteWithoutAssignment && ! $targetUrl && $activeStreams->isNotEmpty()) {
            $selectedStream = $this->pickWeighted($this->highestPrioritySubset($activeStreams));
            if ($selectedStream) {
                ['target_url' => $targetUrl, 'offer' => $selectedOffer] = $this->resolveTargetForStream($selectedStream, $allowedOfferIds);
                $matchedBy = 'fallback_stream';
                $isFallback = true;
            }
        }

        if (! $canRouteWithoutAssignment) {
            $matchedBy = 'private_access_required';
        }

        $clickId = (string) Str::orderedUuid();

        $click = SmartLinkClick::create([
            'partner_program_id' => $smartLink->partner_program_id,
            'smart_link_id' => $smartLink->id,
            'smart_link_stream_id' => $selectedStream?->id,
            'smart_link_assignment_id' => $assignment?->id,
            'offer_id' => $selectedOffer?->id,
            'webmaster_id' => $webmaster?->id,
            'click_id' => $clickId,
            'matched_by' => $matchedBy,
            'is_fallback' => $isFallback,
            'geo' => $geo,
            'device_type' => $deviceType,
            'ip' => $requestIp,
            'user_agent' => $request->userAgent(),
            'referer' => $request->headers->get('referer'),
            'host' => $request->getHost(),
            'path' => $request->path(),
            'target_url' => $targetUrl,
            'query_params' => $query,
            'subid' => $this->extractSubid($query),
            'utm_source' => Arr::get($query, 'utm_source'),
            'utm_medium' => Arr::get($query, 'utm_medium'),
            'utm_campaign' => Arr::get($query, 'utm_campaign'),
            'utm_term' => Arr::get($query, 'utm_term'),
            'utm_content' => Arr::get($query, 'utm_content'),
        ]);

        if (! $targetUrl) {
            return [
                'click' => $click,
                'final_url' => null,
            ];
        }

        $trackingParams = array_filter([
            'click_id' => $clickId,
            'smart_link_id' => $smartLink->id,
            'stream_id' => $selectedStream?->id,
            'offer_id' => $selectedOffer?->id,
        ], static fn ($v) => $v !== null && $v !== '');

        $finalUrl = $this->appendQueryParams($targetUrl, array_merge($query, $trackingParams));

        return [
            'click' => $click,
            'final_url' => $finalUrl,
        ];
    }

    private function resolveAssignment(SmartLink $smartLink, Request $request): ?SmartLinkAssignment
    {
        $token = trim((string) $request->query('wm_token'));
        $webmasterId = (int) ($request->query('wm_id') ?: $request->query('webmaster_id') ?: 0);

        $query = $smartLink->assignments()
            ->where('is_active', true)
            ->with('webmaster:id,is_active');

        if ($token !== '') {
            $query->where('token', $token);
        } elseif ($webmasterId > 0) {
            $query->where('webmaster_id', $webmasterId);
        } else {
            return null;
        }

        $assignment = $query->first();

        if (! $assignment || ! $assignment->webmaster?->is_active) {
            return null;
        }

        return $assignment;
    }

    private function resolveAllowedOfferIds(User $webmaster): array
    {
        return Offer::query()
            ->where('is_active', true)
            ->where(function ($q) use ($webmaster) {
                $q->where(function ($public) use ($webmaster) {
                    $public->where('is_private', false)
                        ->whereDoesntHave('rates', function ($r) use ($webmaster) {
                            $r->where('webmaster_id', $webmaster->id)->where('is_allowed', false);
                        });
                })
                    ->orWhereHas('rates', fn ($r) => $r->where('webmaster_id', $webmaster->id)->where('is_allowed', true));
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function matchesRules(SmartLinkStream $stream, Request $request, ?string $geo, string $deviceType): bool
    {
        $rules = is_array($stream->rules) ? $stream->rules : [];

        $geos = collect((array) Arr::get($rules, 'geos', []))
            ->filter()
            ->map(fn ($item) => strtoupper((string) $item))
            ->values();

        if ($geos->isNotEmpty() && (! $geo || ! $geos->contains($geo))) {
            return false;
        }

        $devices = collect((array) Arr::get($rules, 'devices', []))
            ->filter()
            ->map(fn ($item) => strtolower((string) $item))
            ->values();

        if ($devices->isNotEmpty() && ! $devices->contains($deviceType)) {
            return false;
        }

        $queryRules = Arr::get($rules, 'query', []);
        if (is_array($queryRules)) {
            foreach ($queryRules as $key => $expected) {
                if ($key === '' || $key === null) {
                    continue;
                }

                $actual = $request->query((string) $key);
                if ($actual === null || $actual === '') {
                    return false;
                }

                // "*" means: query parameter must exist with any non-empty value.
                if ((string) $expected === '*') {
                    continue;
                }

                if ($expected !== null && $expected !== '' && (string) $actual !== (string) $expected) {
                    return false;
                }
            }
        }

        return true;
    }

    private function highestPrioritySubset(Collection $streams): Collection
    {
        $priority = (int) $streams->max(fn (SmartLinkStream $stream) => (int) $stream->priority);

        return $streams->where('priority', $priority)->values();
    }

    private function pickWeighted(Collection $streams): ?SmartLinkStream
    {
        if ($streams->isEmpty()) {
            return null;
        }

        $weighted = $streams
            ->map(function (SmartLinkStream $stream) {
                $stream->weight = max((int) $stream->weight, 0);

                return $stream;
            })
            ->values();

        $total = (int) $weighted->sum('weight');

        if ($total <= 0) {
            return $weighted->first();
        }

        $pick = random_int(1, $total);
        $cursor = 0;

        foreach ($weighted as $stream) {
            $cursor += (int) $stream->weight;
            if ($pick <= $cursor) {
                return $stream;
            }
        }

        return $weighted->last();
    }

    private function resolveTargetForStream(SmartLinkStream $stream, ?array $allowedOfferIds): array
    {
        if ($stream->target_url) {
            return [
                'target_url' => $stream->target_url,
                'offer' => null,
            ];
        }

        $weightedOffer = $this->pickWeightedOfferFromRules($stream, $allowedOfferIds);
        if ($weightedOffer) {
            return [
                'target_url' => $this->buildTargetUrlFromOffer($weightedOffer),
                'offer' => $weightedOffer,
            ];
        }

        if ($stream->offer) {
            return [
                'target_url' => $this->buildTargetUrlFromOffer($stream->offer),
                'offer' => $stream->offer,
            ];
        }

        return [
            'target_url' => null,
            'offer' => null,
        ];
    }

    private function streamHasWeightedOffers(SmartLinkStream $stream, ?array $allowedOfferIds): bool
    {
        return $this->pickWeightedOfferFromRules($stream, $allowedOfferIds) !== null;
    }

    private function pickWeightedOfferFromRules(SmartLinkStream $stream, ?array $allowedOfferIds): ?Offer
    {
        $rules = is_array($stream->rules) ? $stream->rules : [];
        $rows = collect((array) Arr::get($rules, 'offer_weights', []))
            ->map(function ($row) {
                if (! is_array($row)) {
                    return null;
                }

                $offerId = (int) ($row['offer_id'] ?? 0);
                if ($offerId <= 0) {
                    return null;
                }

                $weight = isset($row['weight']) && $row['weight'] !== ''
                    ? max((int) $row['weight'], 0)
                    : 100;

                return [
                    'offer_id' => $offerId,
                    'weight' => $weight,
                ];
            })
            ->filter()
            ->values();

        if ($rows->isEmpty()) {
            return null;
        }

        $offers = Offer::query()
            ->where('partner_program_id', $stream->partner_program_id)
            ->whereIn('id', $rows->pluck('offer_id')->all())
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $eligibleRows = $rows->filter(function (array $row) use ($offers, $allowedOfferIds) {
            if (! $offers->has($row['offer_id'])) {
                return false;
            }

            if (is_array($allowedOfferIds)) {
                return in_array((int) $row['offer_id'], $allowedOfferIds, true);
            }

            return true;
        })->values();

        if ($eligibleRows->isEmpty()) {
            return null;
        }

        $total = (int) $eligibleRows->sum(fn (array $row) => (int) $row['weight']);
        if ($total <= 0) {
            $offerId = (int) $eligibleRows->first()['offer_id'];
            return $offers->get($offerId);
        }

        $pick = random_int(1, $total);
        $cursor = 0;
        foreach ($eligibleRows as $row) {
            $cursor += (int) $row['weight'];
            if ($pick <= $cursor) {
                return $offers->get((int) $row['offer_id']);
            }
        }

        return $offers->get((int) $eligibleRows->last()['offer_id']);
    }

    private function buildTargetUrlFromOffer(Offer $offer): ?string
    {
        $offer->loadMissing('landings');

        $linkLanding = $offer->landings->firstWhere('type', 'link');
        if ($linkLanding?->url) {
            return $linkLanding->url;
        }

        $localLanding = $offer->landings->firstWhere('type', 'local');
        if ($localLanding?->preview_path) {
            return Storage::disk('public')->url($localLanding->preview_path);
        }

        return null;
    }

    private function appendQueryParams(string $url, array $params): string
    {
        if ($params === []) {
            return $url;
        }

        $parts = parse_url($url);
        if ($parts === false || empty($parts['host'])) {
            return $url;
        }

        $existing = [];
        if (! empty($parts['query'])) {
            parse_str($parts['query'], $existing);
        }

        $query = http_build_query(array_merge($existing, $params), '', '&', PHP_QUERY_RFC3986);

        $scheme = $parts['scheme'] ?? 'https';
        $authority = $parts['host'];
        if (! empty($parts['port'])) {
            $authority .= ':'.$parts['port'];
        }

        $path = $parts['path'] ?? '';
        $fragment = isset($parts['fragment']) ? '#'.$parts['fragment'] : '';

        return sprintf('%s://%s%s%s%s', $scheme, $authority, $path, $query ? '?'.$query : '', $fragment);
    }

    private function detectDeviceType(?string $userAgent): string
    {
        $ua = strtolower((string) $userAgent);

        if ($ua === '') {
            return 'unknown';
        }

        if (str_contains($ua, 'ipad') || str_contains($ua, 'tablet')) {
            return 'tablet';
        }

        if (str_contains($ua, 'android') || str_contains($ua, 'iphone') || str_contains($ua, 'mobile')) {
            return 'mobile';
        }

        return 'desktop';
    }

    private function extractSubid(array $query): ?string
    {
        foreach (['subid', 'sub1', 'sub2', 'click_id', 'external_click_id'] as $key) {
            $value = Arr::get($query, $key);
            if ($value !== null && $value !== '') {
                return (string) $value;
            }
        }

        return null;
    }
}
