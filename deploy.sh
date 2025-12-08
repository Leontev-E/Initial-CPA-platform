#!/usr/bin/env bash
set -e

APP_DIR="/var/www/openai-book.store"

echo ">>> Перехожу в $APP_DIR"
cd "$APP_DIR"

echo ">>> Обновляю код из Git..."
git pull origin main

echo ">>> Обновляю Composer-зависимости..."
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader

echo ">>> Прогоняю миграции..."
php artisan migrate --force

echo ">>> Собираю фронт (Vite)..."
npm install
npm run build

echo ">>> Чищу и кеширую конфиг/роуты/вьюхи..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ">>> Перезапускаю сервисы..."
systemctl restart cpa-http.service cpa-queue.service cpa-queue-webhooks.service || true

echo ">>> Деплой завершён."
