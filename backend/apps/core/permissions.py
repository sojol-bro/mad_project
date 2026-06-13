from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to Super Admins (admin role).
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsManager(permissions.BasePermission):
    """
    Allows access to Store Managers.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'manager'

class IsCashier(permissions.BasePermission):
    """
    Allows access to Cashiers.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'cashier'

class IsStock(permissions.BasePermission):
    """
    Allows access to Stock Employees.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'stock'

class IsAdminOrManagerOrStock(permissions.BasePermission):
    """
    Allows access to Admin, Manager, and Stock roles.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'manager', 'stock']

class HasBranchAccess(permissions.BasePermission):
    """
    Verifies that the user belongs to the branch associated with the request or resource.
    - Admins have access to all branches.
    - Managers, Cashiers, and Stock users must match the target branch.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admins can access any endpoint
        if request.user.role == 'admin':
            return True
            
        # For object-level checks or specific POST data, we check branch matching.
        return request.user.branch_id is not None

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        if request.user.role == 'admin':
            return True

        # Resolve branch of the object
        obj_branch_id = None
        if hasattr(obj, 'branch_id') and obj.branch_id:
            obj_branch_id = obj.branch_id
        elif hasattr(obj, 'branch') and obj.branch:
            obj_branch_id = obj.branch.id
        elif hasattr(obj, 'user') and obj.user and hasattr(obj.user, 'branch_id'):
            obj_branch_id = obj.user.branch_id
        
        if obj_branch_id is None:
            # If the object doesn't have a branch, let other permission classes decide
            return True

        return str(obj_branch_id) == str(request.user.branch_id)
