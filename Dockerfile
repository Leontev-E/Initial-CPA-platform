FROM php:8.2-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libpq-dev libzip-dev libonig-dev \
    && docker-php-ext-install pdo_pgsql pgsql mbstring bcmath zip pcntl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
