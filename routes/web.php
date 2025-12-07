<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\Admin\OfferCategoryController as AdminOfferCategoryController;
use App\Http\Controllers\Admin\OfferController as AdminOfferController;
use App\Http\Controllers\Admin\PayoutController as AdminPayoutController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\LeadWebhookController as AdminLeadWebhookController;
use App\Http\Controllers\Admin\WebmasterController as AdminWebmasterController;
use App\Http\Controllers\SuperAdmin\PartnerProgramController as SuperAdminPartnerProgramController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Webmaster\DashboardController as WebmasterDashboardController;
use App\Http\Controllers\Webmaster\LeadController as WebmasterLeadController;
use App\Http\Controllers\Webmaster\OfferController as WebmasterOfferController;
use App\Http\Controllers\Webmaster\PayoutController as WebmasterPayoutController;
use Illuminate\Http\Request;
use App\Http\Controllers\Webmaster\ToolController as WebmasterToolController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified', 'role:super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::post('partner-programs/reset-context', [SuperAdminPartnerProgramController::class, 'resetContext'])->name('partner-programs.reset');
    Route::post('partner-programs/{partnerProgram}/switch', [SuperAdminPartnerProgramController::class, 'switch'])->name('partner-programs.switch');
    Route::resource('partner-programs', SuperAdminPartnerProgramController::class)->except(['show']);
});

Route::middleware(['auth', 'verified', 'role:admin', 'section.access', 'partner_program.access'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::resource('offer-categories', AdminOfferCategoryController::class)->except(['create', 'edit']);
    Route::patch('offer-categories/{offer_category}/toggle', [AdminOfferCategoryController::class, 'toggle'])->name('offer-categories.toggle');
    Route::post('offer-categories/{offer_category}/attach-offer', [AdminOfferCategoryController::class, 'attachOffer'])->name('offer-categories.attach');
    Route::delete('offer-categories/{offer_category}/detach-offer', [AdminOfferCategoryController::class, 'detachOffer'])->name('offer-categories.detach');
    Route::resource('offers', AdminOfferController::class)->except(['create', 'edit']);
    Route::patch('offers/{offer}/toggle', [AdminOfferController::class, 'toggle'])->name('offers.toggle');
    Route::post('offers/{offer}/landings', [AdminOfferController::class, 'addLanding'])->name('offers.landings.add');
    Route::delete('offers/{offer}/landings/{landing}', [AdminOfferController::class, 'removeLanding'])->name('offers.landings.remove');

    Route::get('reports', fn () => redirect()->route('admin.reports.offers'))->name('reports.index');
    Route::get('leads', [AdminLeadController::class, 'index'])->name('leads.index');
    Route::get('leads/export', [AdminLeadController::class, 'export'])->name('leads.export');
    Route::get('leads/{lead}', [AdminLeadController::class, 'show'])->name('leads.show');
    Route::patch('leads/{lead}/status', [AdminLeadController::class, 'updateStatus'])->name('leads.updateStatus');

    Route::get('webmasters', [AdminWebmasterController::class, 'index'])->name('webmasters.index');
    Route::post('webmasters', [AdminWebmasterController::class, 'store'])->name('webmasters.store');
    Route::get('webmasters/{user}', [AdminWebmasterController::class, 'show'])->name('webmasters.show');
    Route::patch('webmasters/{user}', [AdminWebmasterController::class, 'update'])->name('webmasters.update');
    Route::patch('webmasters/{user}/password', [AdminWebmasterController::class, 'updatePassword'])->name('webmasters.updatePassword');
    Route::post('webmasters/{user}/resend-password', [AdminWebmasterController::class, 'resendPassword'])->name('webmasters.resendPassword');
    Route::post('webmasters/{user}/impersonate', [AdminWebmasterController::class, 'impersonate'])->name('webmasters.impersonate');
    Route::post('webmasters/{user}/rate', [AdminWebmasterController::class, 'updateRate'])->name('webmasters.rate');
    Route::post('webmasters/{user}/payout', [AdminWebmasterController::class, 'createPayout'])->name('webmasters.payout');
    Route::post('webmasters/{user}/adjust-balance', [AdminWebmasterController::class, 'adjustBalance'])->name('webmasters.adjustBalance');
    Route::delete('webmasters/{user}', [AdminWebmasterController::class, 'destroy'])->name('webmasters.destroy');

    Route::get('payouts', [AdminPayoutController::class, 'index'])->name('payouts.index');
    Route::get('payouts/{payoutRequest}', [AdminPayoutController::class, 'show'])->name('payouts.show');
    Route::post('payouts', [AdminPayoutController::class, 'store'])->name('payouts.store');
    Route::patch('payouts/{payoutRequest}', [AdminPayoutController::class, 'update'])->name('payouts.update');

    Route::get('reports/offers', [AdminReportController::class, 'offers'])->name('reports.offers');
    Route::get('reports/offers/{webmaster}', [AdminReportController::class, 'offersByWebmaster'])->name('reports.offers.webmaster');
    Route::get('reports/webmasters', [AdminReportController::class, 'webmasters'])->name('reports.webmasters');
    Route::get('reports/geo', [AdminReportController::class, 'geo'])->name('reports.geo');

    Route::get('webhooks', [AdminLeadWebhookController::class, 'index'])->name('webhooks.index');
    Route::post('webhooks', [AdminLeadWebhookController::class, 'store'])->name('webhooks.store');
    Route::patch('webhooks/{webhook}', [AdminLeadWebhookController::class, 'update'])->name('webhooks.update');
    Route::delete('webhooks/{webhook}', [AdminLeadWebhookController::class, 'destroy'])->name('webhooks.destroy');
    Route::post('webhooks/incoming/token', [AdminLeadWebhookController::class, 'regenerateIncomingToken'])->name('webhooks.incoming.token');
});

Route::post('webmasters/stop-impersonate', [AdminWebmasterController::class, 'stopImpersonate'])
    ->middleware('auth')
    ->name('webmasters.stopImpersonate');

Route::middleware(['auth', 'verified', 'role:webmaster', 'partner_program.access'])->prefix('webmaster')->name('webmaster.')->group(function () {
    Route::get('/dashboard', [WebmasterDashboardController::class, 'index'])->name('dashboard');
    Route::get('/offers', [WebmasterOfferController::class, 'index'])->name('offers.index');
    Route::get('/offers/{offer}', [WebmasterOfferController::class, 'show'])->name('offers.show');
    Route::get('/offers/{offer}/api-script', [WebmasterOfferController::class, 'downloadApiScript'])->name('offers.apiScript');
    Route::get('/leads', [WebmasterLeadController::class, 'index'])->name('leads.index');
    Route::get('/leads/export', [WebmasterLeadController::class, 'export'])->name('leads.export');
    Route::get('/tools', [WebmasterToolController::class, 'index'])->name('tools.index');
    Route::post('/tools/regenerate-key', [WebmasterToolController::class, 'regenerateKey'])->name('tools.regenerate');
    Route::post('/tools/postbacks', [WebmasterToolController::class, 'savePostbacks'])->name('tools.postbacks');
    Route::get('/payouts', [WebmasterPayoutController::class, 'index'])->name('payouts.index');
    Route::post('/payouts', [WebmasterPayoutController::class, 'store'])->name('payouts.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/invite', [ProfileController::class, 'invite'])->name('profile.invite');
    Route::patch('/profile/employees/{user}', [ProfileController::class, 'updateEmployee'])->name('profile.employees.update');
    Route::delete('/profile/employees/{user}', [ProfileController::class, 'destroyEmployee'])->name('profile.employees.destroy');
    Route::post('/profile/employees/{user}/impersonate', [ProfileController::class, 'impersonateEmployee'])->name('profile.employees.impersonate');

    Route::get('landings/{landing}/download', [LandingController::class, 'download'])->name('landings.download');
    Route::get('landings/{landing}/preview', [LandingController::class, 'preview'])->name('landings.preview');
});

Route::post('/locale', function (Request $request) {
    $locale = $request->input('locale');
    if (in_array($locale, ['ru', 'en'], true)) {
        session(['locale' => $locale]);
        app()->setLocale($locale);
    }
    return back();
})->name('locale.switch');

require __DIR__.'/auth.php';
