<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['ru', 'en'];

    private const CIS_BROWSER_LANGS = [
        'ru', // Russian
        'uk', // Ukrainian
        'be', // Belarusian
        'kk', // Kazakh
        'uz', // Uzbek
        'ky', // Kyrgyz
        'tg', // Tajik
        'az', // Azerbaijani
        'hy', // Armenian
        'ka', // Georgian
        'mo', // Moldovan (legacy tag)
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->query('lang', $request->input('locale'));

        if ($locale && in_array($locale, self::SUPPORTED, true)) {
            session(['locale' => $locale]);
        }

        if (!$request->session()->has('locale')) {
            session(['locale' => $this->detectLocaleFromBrowser($request)]);
        }

        $current = (string) session('locale', 'en');
        app()->setLocale(in_array($current, self::SUPPORTED, true) ? $current : 'en');

        return $next($request);
    }

    private function detectLocaleFromBrowser(Request $request): string
    {
        foreach ($request->getLanguages() as $language) {
            $normalized = strtolower(str_replace('_', '-', (string) $language));
            $base = explode('-', $normalized)[0] ?? '';

            if (in_array($base, self::CIS_BROWSER_LANGS, true)) {
                return 'ru';
            }
        }

        return 'en';
    }
}
