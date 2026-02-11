<?php

use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\IncomingLeadWebhookController;
use App\Http\Controllers\Api\SmartLinkPostbackController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function () {
    Route::get('/health/live', [HealthController::class, 'live']);
    Route::get('/health/ready', [HealthController::class, 'ready']);

    Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:api-leads');
    Route::post('/webhooks/leads/status', [IncomingLeadWebhookController::class, 'updateStatus'])
        ->name('api.webhooks.leads.status');
    Route::match(['get', 'post'], '/smart-links/postback', SmartLinkPostbackController::class)
        ->name('api.smart-links.postback');
});
