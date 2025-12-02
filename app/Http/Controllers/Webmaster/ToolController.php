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
        $validated = $request->validate([
            'postbacks' => ['array'],
            'postbacks.*.event' => ['required', 'in:lead,sale,trash'],
            'postbacks.*.url' => ['required', 'url'],
            'postbacks.*.is_active' => ['boolean'],
        ]);

        foreach ($validated['postbacks'] ?? [] as $pb) {
            PostbackSetting::updateOrCreate(
                ['webmaster_id' => $user->id, 'event' => $pb['event']],
                ['url' => $pb['url'], 'is_active' => $pb['is_active'] ?? true],
            );
        }

        return back()->with('success', 'Постбеки сохранены');
    }
}
