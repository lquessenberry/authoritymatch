FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    unzip \
    git \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql pdo_pgsql zip opcache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configure Apache to listen on Fly's expected internal port.
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf

# Set working directory
WORKDIR /var/www/html

# Copy Drupal files
COPY drupal/composer.json drupal/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY drupal/web ./web
COPY drupal/config ./config
COPY drupal/drush ./drush
COPY drupal/recipes ./recipes
COPY drupal/scripts ./scripts

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/web/sites/default/files

# Apache configuration
COPY infra/fly/drupal/apache.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 8080

# Start Apache
CMD ["apache2-foreground"]
