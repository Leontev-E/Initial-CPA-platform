<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Приглашение в BoostClicks</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; }
        .card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; max-width: 520px; margin: 0 auto; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; }
        .text { font-size: 14px; color: #475569; line-height: 1.5; }
        .block { margin-top: 12px; padding: 12px; border-radius: 8px; background: #f1f5f9; }
        .footer { margin-top: 16px; font-size: 12px; color: #94a3b8; }
        .mono { font-family: 'Courier New', monospace; }
    </style>
</head>
<body>
    <div class="card">
        <div class="title">Приглашение в партнерскую программу BoostClicks</div>
        <p class="text">Вас пригласил: {{ $inviter->name }} ({{ $inviter->email ?? '—' }})</p>
        @php
            $roleMap = [
                'admin' => 'Админ',
                'tech' => 'Технический специалист',
                'accounting' => 'Бухгалтерия',
                'operator' => 'Оператор',
            ];
        @endphp
        <div class="block">
            <div class="text"><strong>Роль:</strong> {{ $roleMap[$employee->employee_role] ?? $employee->employee_role }}</div>
            <div class="text"><strong>Логин (email):</strong> <span class="mono">{{ $employee->email }}</span></div>
            <div class="text"><strong>Пароль:</strong> <span class="mono">{{ $password }}</span></div>
        </div>
        <p class="text">Перейдите на <a href="https://openai-book.store">https://openai-book.store</a> и войдите, используя данные выше.</p>
        <div class="footer">
            BoostClicks — <a href="https://boostclicks.ru">https://boostclicks.ru</a> — <a href="https://t.me/boostclicks">https://t.me/boostclicks</a>
        </div>
    </div>
</body>
</html>
