import os
from celery import Celery

# Set default settings module (development settings)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

app = Celery('config')

# Configure Celery using settings starting with 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically discover tasks.py in installed apps
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
