from .base import *

DEBUG = True

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-dev-secret-key-9876543210")

ALLOWED_HOSTS = ["*"]
