from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView, MFAVerifyView, MFAEnableView, MFAVerifySetupView, MFADisableView,
    BranchViewSet, CustomUserViewSet, CategoryViewSet, ProductViewSet, 
    SupplierViewSet, ProductBatchViewSet, InventoryViewSet, PurchaseViewSet, 
    SaleViewSet, CustomerViewSet, NotificationView, AnalyticsDashboardView, 
    FileStorageSignedUrlView
)

router = DefaultRouter()
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'batches', ProductBatchViewSet, basename='batch')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'purchases', PurchaseViewSet, basename='purchase')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'customers', CustomerViewSet, basename='customer')

urlpatterns = [
    # Custom Router paths (branches, users, categories, products, suppliers, batches, inventory, purchases, sales, customers)
    path('', include(router.urls)),
    
    # Custom Auth / MFA paths
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/mfa/verify/', MFAVerifyView.as_view(), name='auth-mfa-verify'),
    path('auth/mfa/enable/', MFAEnableView.as_view(), name='auth-mfa-enable'),
    path('auth/mfa/verify-setup/', MFAVerifySetupView.as_view(), name='auth-mfa-verify-setup'),
    path('auth/mfa/disable/', MFADisableView.as_view(), name='auth-mfa-disable'),
    
    # Custom business modules / utilities
    path('notifications/', NotificationView.as_view(), name='notifications'),
    path('analytics/dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('files/signed-url/', FileStorageSignedUrlView.as_view(), name='files-signed-url'),
]
