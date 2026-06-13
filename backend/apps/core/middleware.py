import json
from django.utils.deprecation import MiddlewareMixin
from .models import ActivityLog
import uuid

class AuditLoggingMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Only log authenticated requests that modify data (POST, PUT, PATCH, DELETE)
        if request.user and request.user.is_authenticated:
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                status_code = response.status_code
                # Only log successful or accepted requests
                if 200 <= status_code < 300:
                    action = f"{request.method} {request.path}"
                    entity_type = None
                    entity_id = None
                    
                    # Extract entity from URL path
                    path_parts = [p for p in request.path.split('/') if p]
                    if len(path_parts) >= 3:
                        entity_type = path_parts[2] # e.g. /api/v1/products/ -> products
                        
                    # Extract entity ID if present as UUID in response data or URL
                    try:
                        if response.get('Content-Type') == 'application/json':
                            data = json.loads(response.content)
                            if isinstance(data, dict) and 'id' in data:
                                entity_id = uuid.UUID(data['id'])
                    except Exception:
                        pass
                        
                    # Save activity log
                    try:
                        ActivityLog.objects.create(
                            user=request.user,
                            action=action,
                            entity_type=entity_type,
                            entity_id=entity_id
                        )
                    except Exception:
                        # Fail-safe to avoid blocking response on log error
                        pass
                        
        return response
