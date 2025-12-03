<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Код подтверждения</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; }
        .card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; max-width: 480px; margin: 0 auto; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; }
        .code { font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #2563eb; margin: 16px 0; }
        .text { font-size: 14px; color: #475569; line-height: 1.5; }
        .footer { margin-top: 16px; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <div class="title">BoostClicks — подтверждение почты</div>
        <p class="text">Здравствуйте, {{ $user->name }}!</p>
        <p class="text">Введите этот код на сайте, чтобы завершить регистрацию:</p>
        <div class="code">{{ $code }}</div>
        <p class="text">Код действует 15 минут. Если вы не запрашивали регистрацию, просто проигнорируйте письмо.</p>
        <div class="footer">
            BoostClicks — <a href="https://boostclicks.ru">https://boostclicks.ru</a> — <a href="https://t.me/boostclicks">https://t.me/boostclicks</a>
        </div>
    </div>
</body>
</html>
