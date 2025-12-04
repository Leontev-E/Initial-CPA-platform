<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Доступ к партнерской программе BoostClicks</title>
    <style>
        body { font-family: Arial, sans-serif; background: #0f172a; padding: 32px; color: #e2e8f0; }
        .card { background: linear-gradient(135deg, #111827, #1f2937); border-radius: 16px; padding: 24px; border: 1px solid #334155; max-width: 560px; margin: 0 auto; box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
        .title { font-size: 20px; font-weight: 700; color: #f8fafc; }
        .text { font-size: 14px; color: #cbd5e1; line-height: 1.6; }
        .block { margin-top: 16px; padding: 14px; border-radius: 12px; background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.25); }
        .mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace; color: #e0f2fe; }
        .cta { margin-top: 18px; display: inline-block; padding: 12px 18px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; }
        .footer { margin-top: 18px; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <div class="title">Вас пригласили в партнерскую программу BoostClicks</div>
        <p class="text">
            Пригласил: {{ $inviter->name }} ({{ $inviter->email ?? '—' }}).<br>
            Вы получили доступ к кабинету вебмастера.
        </p>
        <div class="block">
            <div class="text"><strong>Ссылка для входа:</strong> <a class="mono" href="{{ config('app.url') }}">{{ config('app.url') }}</a></div>
            <div class="text"><strong>Email (логин):</strong> <span class="mono">{{ $user->email }}</span></div>
            @if($user->telegram)
                <div class="text"><strong>Telegram:</strong> <span class="mono">{{ $user->telegram }}</span></div>
            @endif
            <div class="text"><strong>Пароль:</strong> <span class="mono">{{ $password }}</span></div>
        </div>
        <a class="cta" href="{{ config('app.url') }}">Перейти в кабинет</a>
        <div class="footer">
            BoostClicks — <a href="https://boostclicks.ru" style="color:#cbd5e1;">https://boostclicks.ru</a> — <a href="https://t.me/boostclicks" style="color:#cbd5e1;">https://t.me/boostclicks</a>
        </div>
    </div>
</body>
</html>
