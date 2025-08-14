from pathlib import Path
import os

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = 'django-insecure-28n-0q$$c#rrbkyj!9#8)78p(0onl^06j0hk60pbe9oh&=^l%='
DEBUG = True
ALLOWED_HOSTS = []

# Installed apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',

    # Custom apps
    'users',
]

# Middleware configuration
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be near top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'humoura_backend.urls'

# Templates configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'humoura_backend.wsgi.application'

# Database configuration (MySQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'harmoura',
        'USER': 'root',
        'PASSWORD': 'password',  # replace with your MySQL root password
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'

# Allow frontend to communicate with backend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),  # default 1 hour
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),  # default 1 day
    "ROTATE_REFRESH_TOKENS": True,
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

# Media files (user-uploaded content like songs)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')