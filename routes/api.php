<?php

use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\IncomingLeadWebhookController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function () {
    Route::post('/leads', [LeadController::class, 'store']);
    Route::post('/webhooks/leads/status', [IncomingLeadWebhookController::class, 'updateStatus'])
        ->name('api.webhooks.leads.status');
});
