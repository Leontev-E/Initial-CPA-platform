<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.partner-programs.index');
        }

        if ($user->isPartnerAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('webmaster.dashboard');
    }
}
