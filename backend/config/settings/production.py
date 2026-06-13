from .base import *
import os

DEBUG = False

SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("The SECRET_KEY environment variable is required in production.")

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# HSTS Security Settings
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Secure Cookie Settings
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
SECURE_REFERRER_POLICY = "same-origin"
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# X-Frame-Options (Clickjacking Protection)
X_FRAME_OPTIONS = 'DENY'

# CSP (Content Security Policy) header settings if needed
# We can configure django-csp or just set headers via Nginx or middleware.
