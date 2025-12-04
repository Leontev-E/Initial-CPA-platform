<?php

namespace App\Http\Controllers;

use App\Models\OfferLanding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class LandingController extends Controller
{
    public function download(OfferLanding $landing)
    {
        $this->authorizeView($landing);

        if ($landing->type !== 'local' || ! $landing->file_path) {
            abort(404);
        }

        return Storage::disk('public')->download($landing->file_path, $landing->name.'.zip');
    }

    public function preview(OfferLanding $landing)
    {
        $this->authorizeView($landing);

        if ($landing->type === 'link' && $landing->url) {
            return redirect()->away($landing->url);
        }

        if ($landing->type === 'local' && $landing->preview_path) {
            return redirect()->to(Storage::disk('public')->url($landing->preview_path));
        }

        abort(Response::HTTP_NOT_FOUND);
    }

    protected function authorizeView(OfferLanding $landing): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(401);
        }

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isWebmaster()) {
            return;
        }

        abort(403);
    }
}
