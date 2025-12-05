<?php

namespace App\Http\Controllers\Webmaster;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\PostbackSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ToolController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $apiKey = ApiKey::firstOrCreate(
            ['webmaster_id' => $user->id, 'is_active' => true],
            ['key' => Str::uuid()->toString()]
        );

        $postbacks = PostbackSetting::where('webmaster_id', $user->id)->get();

        return Inertia::render('Webmaster/Tools/Index', [
            'apiKey' => $apiKey,
            'postbacks' => $postbacks,
        ]);
    }

    public function regenerateKey(Request $request)
    {
        $user = $request->user();
        ApiKey::where('webmaster_id', $user->id)->update(['is_active' => false]);

        $apiKey = ApiKey::create([
            'webmaster_id' => $user->id,
            'key' => Str::uuid()->toString(),
            'is_active' => true,
        ]);

        return back()->with('success', 'API ключ обновлен')->with('apiKey', $apiKey);
    }

    public function savePostbacks(Request $request)
    {
        $user = $request->user();
        $filtered = collect($request->input('postbacks', []))
            ->map(function ($pb) {
                return [
                    'event' => $pb['event'] ?? '',
                    'url' => trim($pb['url'] ?? ''),
                    'is_active' => $pb['is_active'] ?? true,
                ];
            })
            ->filter(fn ($pb) => $pb['url'] !== '');

        $validated = validator($filtered->toArray(), [
            '*.event' => ['required', 'in:lead,in_work,sale,cancel,trash'],
            '*.url' => ['required', 'url'],
            '*.is_active' => ['boolean'],
        ])->validate();

        foreach ($validated as $pb) {
            PostbackSetting::updateOrCreate(
                ['webmaster_id' => $user->id, 'event' => $pb['event']],
                ['url' => $pb['url'], 'is_active' => $pb['is_active'] ?? true],
            );
        }

        return back()->with('success', 'Постбеки сохранены');
    }
}
