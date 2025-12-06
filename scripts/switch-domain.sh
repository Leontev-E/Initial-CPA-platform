#!/usr/bin/env bash
set -euo pipefail

NEW_DOMAIN="cpa.boostclicks.ru"
APP_DIR="/var/www/openai-book.store"

echo ">>> Перехожу в ${APP_DIR}"
cd "$APP_DIR"

echo ">>> Обновляю .env APP_URL и SANCTUM_STATEFUL_DOMAINS"
if [ -f .env ]; then
  sed -i "s|^APP_URL=.*|APP_URL=https://${NEW_DOMAIN}|" .env
  sed -i "s|^SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS=${NEW_DOMAIN}|" .env
else
  echo ".env не найден — пропускаю"
fi

echo ">>> Напоминание: проверьте Nginx (server_name ${NEW_DOMAIN}) и сертификаты /etc/letsencrypt/live/${NEW_DOMAIN}"
echo "Готово. После проверки выполните npm run build и очистку кешей artisan."
