#!/usr/bin/env bash
set -e

APP_DIR="/var/www/openai-book.store"

echo ">>> Перехожу в ${APP_DIR}"
cd "${APP_DIR}"

echo ">>> Обновляю код из Git..."
git pull origin main

echo ">>> Обновляю composer-зависимости..."
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader

echo ">>> Прогоняю миграции..."
php artisan migrate --force

echo ">>> Собираю фронт (Vite)..."
npm install
npm run build

echo ">>> Переключаю домен в .env на cpa.boostclicks.ru"
./scripts/switch-domain.sh

echo ">>> Чищу/кеширую роуты и вьюхи..."
php artisan route:clear
php artisan view:clear
php artisan route:cache
php artisan view:cache

echo ">>> Перезапускаю сервисы cpa-http и cpa-queue..."
systemctl restart cpa-http.service cpa-queue.service

echo ">>> Миграция на cpa.boostclicks.ru завершена."
