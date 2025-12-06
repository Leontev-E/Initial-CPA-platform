# CPA Platform (cpa.boostclicks.ru)

## 📌 О проекте (RU)
Единый монолит (Laravel + React/Inertia + Tailwind) для CPA-платформы с двумя кабинетами:
- **Админ ПП**: дашборд KPI, CRUD категорий/офферов, управление лидами/ставками, вебмастерами, выплатами, отчёты (офферы/вебмастера/GEO, CSV).
- **Вебмастер**: дашборд с балансом, список офферов с индивидуальными ставками, статистика лидов, инструменты (API-ключ, постбеки), заявки на выплаты.
- **API вебмастера**: `POST https://cpa.boostclicks.ru/api/leads` с заголовком `X-API-KEY`.

## 🛠️ Стек
- PHP 8.2, Laravel 12, Inertia, Sanctum
- PostgreSQL 14+ (основная БД)
- React + Tailwind + Vite (сборка в `public/build`)
- Nginx + PHP-FPM, HTTPS `https://cpa.boostclicks.ru`

## 🚀 Функционал
- **Роли и безопасность**: `admin`, `webmaster`, блокировка `is_active`, трекинг `last_login_at/last_activity_at`.
- **Категории/офферы**: CRUD, GEO, дефолт/кастом ставки, описание, изображение.
- **Лиды**: статусы `new/in_work/sale/cancel/trash`, фильтры, смена статуса с расчётом payout (кастом/дефолт), постбеки по событиям.
- **Вебмастера**: создание с временным паролем, блокировка, индивидуальные ставки, статистика, баланс.
- **Выплаты**: заявки `pending/in_process/paid/cancelled`, учёт баланса (sale payout минус paid).
- **Отчёты**: офферы / вебмастера / GEO с CSV-выгрузкой.
- **Кабинет вебмастера**: баланс, лиды/продажи, график, топ офферы, API-ключ, постбеки, выплаты.

## 📡 API (приём лида)
```
POST https://cpa.boostclicks.ru/api/leads
Headers: X-API-KEY: <ключ вебмастера>
Body (JSON): {
  "offer_id": 1,
  "geo": "RU",
  "customer_name": "Имя",
  "customer_phone": "+79990000000",
  "customer_email": "test@example.com",
  "subid": "click123",
  "landing_url": "https://example.com/landing",
  "ip": "1.2.3.4",
  "user_agent": "Mozilla/5.0",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "cmp",
  "utm_term": "kw",
  "utm_content": "ad1",
  "tags": {"adset_id": "123", "ad_id": "456"}
}
```

## 🖥️ Установка на Ubuntu 22.04 (один сервер: веб + БД)
1) Зависимости  
```
sudo apt update
sudo apt install -y software-properties-common curl git zip unzip
sudo add-apt-repository -y ppa:ondrej/php
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nginx postgresql postgresql-contrib nodejs php8.2 php8.2-fpm php8.2-pgsql php8.2-xml php8.2-mbstring php8.2-zip php8.2-curl php8.2-gd php8.2-bcmath composer
```
2) Код и сборка  
```
git clone <repo-url> /var/www/openai-book.store
cd /var/www/openai-book.store
composer install --no-dev --optimize-autoloader
npm ci
npm run build
```
3) .env (боевой)  
```
cp .env.example .env
php artisan key:generate --show   # подставить в APP_KEY
APP_ENV=production
APP_DEBUG=false
APP_URL=https://cpa.boostclicks.ru
DB_DATABASE=<db>
DB_USERNAME=<user>
DB_PASSWORD=<pass>
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_SCHEMA=public
SESSION_DRIVER=database
QUEUE_CONNECTION=database
SANCTUM_STATEFUL_DOMAINS=cpa.boostclicks.ru
```
4) Миграции/сиды, оптимизация  
```
php artisan migrate --seed --env=production --ansi
php artisan config:cache
php artisan route:cache
php artisan view:cache
chown -R www-data:www-data storage bootstrap/cache
```
5) Nginx (пример)  
```
server {
  listen 80;
  server_name cpa.boostclicks.ru;
  return 301 https://$host$request_uri;
}
server {
  listen 443 ssl;
  server_name cpa.boostclicks.ru;
  root /var/www/openai-book.store/public;
  index index.php;
  ssl_certificate /etc/letsencrypt/live/cpa.boostclicks.ru/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/cpa.boostclicks.ru/privkey.pem;
  location / { try_files $uri $uri/ /index.php?$query_string; }
  location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
  }
}
```
6) Доступы после сидов  
- Admin: `admin@cpa.test` / `password`  
- Webmaster: `webmaster@cpa.test` / `password`  
Смените пароли сразу.

## 📘 English (short)
Monolith CPA platform on Laravel + React (Inertia) + Tailwind. Roles: admin/webmaster. Features: offers/categories CRUD, leads with statuses, per-webmaster payouts, balances & payout requests, reports (offers/webmasters/GEO), API intake `POST https://cpa.boostclicks.ru/api/leads` with `X-API-KEY`. Stack: PHP 8.2, Laravel 12, PostgreSQL 14+, Nginx + PHP-FPM, React/Tailwind build via Vite. Install: clone, `composer install --no-dev`, `npm ci && npm run build`, set `.env` (production, DB creds, APP_URL=https://cpa.boostclicks.ru, DB_CONNECTION=pgsql, DB_HOST/PORT/DB/USER/PASSWORD/SCHEMA), `php artisan migrate --seed`, cache config/routes/views, configure Nginx as above. Default seeded logins: admin `admin@cpa.test` / `password`, webmaster `webmaster@cpa.test` / `password`.

## Автор
BoostClicks — Евгений Леонтьев — https://t.me/boostclicks  
BoostClicks — https://boostclicks.ru/
