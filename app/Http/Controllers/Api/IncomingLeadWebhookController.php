<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadWebhookLog;
use App\Models\User;
use App\Support\PartnerProgramContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IncomingLeadWebhookController extends Controller
{
    private const ALLOWED_STATUSES = ['new', 'in_work', 'sale', 'cancel', 'trash'];

    public function updateStatus(Request $request): JsonResponse
    {
        $token = $request->header('X-Webhook-Token') ?? $request->query('token') ?? $request->input('token');
        if (! $token) {
            return $this->unauthorized('Не передан токен вебхука');
        }

        $user = User::query()
            ->where('role', User::ROLE_ADMIN)
            ->where('incoming_webhook_token', $token)
            ->first();

        if (! $user) {
            return $this->unauthorized('Неверный токен вебхука');
        }

        app(PartnerProgramContext::class)->setPartnerProgramId($user->partner_program_id);

        $validator = Validator::make($request->all(), [
            'lead_id' => ['required', 'integer'],
            'status' => ['required', 'in:'.implode(',', self::ALLOWED_STATUSES)],
            'comment' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'string', 'max:255'],
        ], [
            'lead_id.required' => 'lead_id обязателен',
            'lead_id.integer' => 'lead_id должен быть числом',
            'status.required' => 'status обязателен',
            'status.in' => 'Некорректный статус',
        ]);

        if ($validator->fails()) {
            $this->logIncoming(
                $request,
                $user->id,
                $request->only(['lead_id', 'status', 'comment', 'source']),
                null,
                $validator->errors()->first(),
                422
            );

            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $lead = Lead::find($data['lead_id']);
        if (! $lead) {
            $this->logIncoming($request, $user->id, $data, null, 'Лид не найден', 404);

            return response()->json([
                'success' => false,
                'message' => 'Лид не найден',
            ], 404);
        }

        $oldStatus = $lead->status;
        $lead->status = $data['status'];
        if (! empty($data['comment'])) {
            $lead->comment = $data['comment'];
        }
        $lead->save();

        $this->logIncoming($request, $user->id, $data, $lead, null, 200, $oldStatus, $lead->status);

        return response()->json([
            'success' => true,
            'lead_id' => $lead->id,
            'old_status' => $oldStatus,
            'new_status' => $lead->status,
        ]);
    }

    private function unauthorized(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 401);
    }

    private function logIncoming(Request $request, int $userId, ?array $payload, ?Lead $lead, ?string $error, ?int $statusCode, ?string $statusBefore = null, ?string $statusAfter = null): void
    {
        try {
            LeadWebhookLog::create([
                'direction' => 'incoming',
                'event' => 'incoming_status_update',
                'user_id' => $userId,
                'lead_id' => $payload['lead_id'] ?? $lead?->id,
                'offer_id' => $lead?->offer_id,
                'status_before' => $statusBefore,
                'status_after' => $statusAfter,
                'method' => 'post',
                'url' => $request->fullUrl(),
                'payload' => $payload ?? $request->all(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status_code' => $statusCode,
                'error_message' => $error,
            ]);
        } catch (\Throwable $e) {
            // Не пробрасываем исключение, чтобы не сломать обработку запроса
        }
    }
}
