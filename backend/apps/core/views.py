import os
import random
import uuid
from datetime import timedelta, date
from decimal import Decimal

from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Sum, F, Q, Count
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from django.contrib.auth import authenticate

from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated, AllowAny, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

import pyotp

from .models import (
    Branch, CustomUser, Category, Product, Supplier, 
    ProductBatch, Inventory, Purchase, PurchaseItem, Sale, SaleItem, ActivityLog
)
from .serializers import (
    BranchSerializer, CustomUserSerializer, CategorySerializer, ProductSerializer, 
    SupplierSerializer, ProductBatchSerializer, InventorySerializer, 
    PurchaseSerializer, SaleSerializer, ActivityLogSerializer, LoginSerializer
)
from .permissions import IsAdmin, IsManager, IsStock, IsAdminOrManagerOrStock, HasBranchAccess


# --- Authentication & MFA ---

class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: dict})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Check if MFA is enabled in Redis
        mfa_enabled = cache.get(f"mfa_enabled:{user.id}", False)
        if mfa_enabled:
            # Generate temporary MFA ticket
            ticket = str(uuid.uuid4())
            cache.set(f"mfa_ticket:{ticket}", str(user.id), timeout=300) # 5 minutes
            
            # Send Email OTP automatically if email OTP setup exists
            otp_code = f"{random.randint(100000, 999999)}"
            cache.set(f"email_otp:{user.id}", otp_code, timeout=300)
            
            # Mock sending email (prints to console/logs in development)
            send_mail(
                subject="Your ShopNest POS MFA Verification Code",
                message=f"Your verification code is: {otp_code}. It will expire in 5 minutes.",
                from_email="no-reply@shopnestpos.com",
                recipient_list=[user.email],
                fail_silently=True
            )

            return Response({
                "mfa_required": True,
                "ticket": ticket,
                "methods": ["totp", "email"]
            }, status=status.HTTP_200_OK)

        # No MFA: Return standard JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": CustomUserSerializer(user).data
        }, status=status.HTTP_200_OK)

class MFAVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ticket = request.data.get('ticket')
        code = request.data.get('code')
        method = request.data.get('method', 'totp') # 'totp' or 'email'

        if not ticket or not code:
            return Response({"detail": "Ticket and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        user_id = cache.get(f"mfa_ticket:{ticket}")
        if not user_id:
            return Response({"detail": "Invalid or expired ticket"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST)

        if method == 'totp':
            totp_secret = cache.get(f"mfa_totp_secret:{user.id}")
            if not totp_secret:
                return Response({"detail": "TOTP is not configured"}, status=status.HTTP_400_BAD_REQUEST)
            totp = pyotp.TOTP(totp_secret)
            if not totp.verify(code):
                return Response({"detail": "Invalid TOTP code"}, status=status.HTTP_400_BAD_REQUEST)
        elif method == 'email':
            cached_otp = cache.get(f"email_otp:{user.id}")
            if not cached_otp or cached_otp != code:
                return Response({"detail": "Invalid or expired Email OTP"}, status=status.HTTP_400_BAD_REQUEST)
            cache.delete(f"email_otp:{user.id}")
        else:
            return Response({"detail": "Invalid MFA method"}, status=status.HTTP_400_BAD_REQUEST)

        # MFA verification successful: issue tokens
        cache.delete(f"mfa_ticket:{ticket}")
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": CustomUserSerializer(user).data
        }, status=status.HTTP_200_OK)

class MFAEnableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        totp_secret = pyotp.random_base32()
        cache.set(f"temp_totp_secret:{user.id}", totp_secret, timeout=600) # 10 minutes to verify setup

        totp = pyotp.TOTP(totp_secret)
        provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="ShopNest POS Elite")

        return Response({
            "secret": totp_secret,
            "provisioning_uri": provisioning_uri
        }, status=status.HTTP_200_OK)

class MFAVerifySetupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get('code')
        temp_secret = cache.get(f"temp_totp_secret:{user.id}")

        if not temp_secret:
            return Response({"detail": "MFA setup has not been initiated or has expired"}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(temp_secret)
        if totp.verify(code):
            # Save secrets persistently in Redis cache (unexpired)
            cache.set(f"mfa_totp_secret:{user.id}", temp_secret, timeout=None)
            cache.set(f"mfa_enabled:{user.id}", True, timeout=None)
            cache.delete(f"temp_totp_secret:{user.id}")
            return Response({"detail": "MFA enabled successfully"}, status=status.HTTP_200_OK)

        return Response({"detail": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)

class MFADisableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        cache.delete(f"mfa_totp_secret:{user.id}")
        cache.delete(f"mfa_enabled:{user.id}")
        return Response({"detail": "MFA disabled successfully"}, status=status.HTTP_200_OK)

# --- Business ViewSets ---

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]

    def get_queryset(self):
        # Isolation: non-admins can only see their own branch
        if self.request.user.role != 'admin':
            return self.queryset.filter(id=self.request.user.branch_id)
        return self.queryset

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]

    def get_queryset(self):
        # Isolation: Managers can view users belonging to their own branch
        if self.request.user.role != 'admin':
            return self.queryset.filter(branch_id=self.request.user.branch_id)
        return self.queryset

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]

    def get_permissions(self):
        # Read operations allowed for all authenticated users. Modifying requires admin/manager/stock clerk.
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated(), HasBranchAccess()]
        return [IsAuthenticated(), IsAdminOrManagerOrStock()]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('inventory_records')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand']
    search_fields = ['name', 'barcode', 'brand']
    ordering_fields = ['name', 'selling_price', 'created_at']

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated(), HasBranchAccess()]
        return [IsAuthenticated(), IsAdminOrManagerOrStock()]

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        barcode = request.query_params.get('barcode')
        if not barcode:
            return Response({"detail": "Barcode param is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(barcode=barcode)
            serializer = self.get_serializer(product)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrManagerOrStock()]

class ProductBatchViewSet(viewsets.ModelViewSet):
    queryset = ProductBatch.objects.all().select_related('product', 'supplier', 'branch')
    serializer_class = ProductBatchSerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return self.queryset.filter(branch_id=self.request.user.branch_id)
        return self.queryset

class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventory.objects.all().select_related('product', 'branch').order_by('id')
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['branch', 'product']
    search_fields = ['product__name', 'product__barcode']

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return self.queryset.filter(branch_id=self.request.user.branch_id)
        return self.queryset

    @action(detail=False, methods=['post'])
    def adjust(self, request):
        product_id = request.data.get('product_id')
        branch_id = request.data.get('branch_id')
        quantity = request.data.get('quantity') # integer (can be positive or negative)
        reason = request.data.get('reason', 'Adjustment')

        if not product_id or not branch_id or quantity is None:
            return Response({"detail": "product_id, branch_id, and quantity are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check permissions
        if request.user.role != 'admin' and str(request.user.branch_id) != str(branch_id):
            return Response({"detail": "Unauthorized to adjust inventory for another branch"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            inv, created = Inventory.objects.get_or_create(
                product_id=product_id,
                branch_id=branch_id,
                defaults={'total_quantity': 0}
            )
            old_qty = inv.total_quantity
            inv.total_quantity = max(0, inv.total_quantity + int(quantity))
            inv.save()

            # Record in ActivityLog
            ActivityLog.objects.create(
                user=request.user,
                action=f"Inventory Adjustment ({reason}): Product {product_id} changed from {old_qty} to {inv.total_quantity}",
                entity_type="inventory",
                entity_id=inv.id
            )

        return Response(InventorySerializer(inv).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def transfer(self, request):
        product_id = request.data.get('product_id')
        from_branch_id = request.data.get('from_branch_id')
        to_branch_id = request.data.get('to_branch_id')
        quantity = int(request.data.get('quantity', 0))

        if not product_id or not from_branch_id or not to_branch_id or quantity <= 0:
            return Response({"detail": "Invalid parameter set"}, status=status.HTTP_400_BAD_REQUEST)

        # Branch verification
        if request.user.role != 'admin' and str(request.user.branch_id) != str(from_branch_id):
            return Response({"detail": "Unauthorized to transfer from this branch"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # Check source inventory
            try:
                source_inv = Inventory.objects.get(product_id=product_id, branch_id=from_branch_id)
            except Inventory.DoesNotExist:
                return Response({"detail": "Source inventory record does not exist"}, status=status.HTTP_400_BAD_REQUEST)

            if source_inv.total_quantity < quantity:
                return Response({"detail": "Insufficient stock for transfer"}, status=status.HTTP_400_BAD_REQUEST)

            # Deduct source
            source_inv.total_quantity -= quantity
            source_inv.save()

            # Add target
            target_inv, created = Inventory.objects.get_or_create(
                product_id=product_id,
                branch_id=to_branch_id,
                defaults={'total_quantity': 0}
            )
            target_inv.total_quantity += quantity
            target_inv.save()

            # Activity Log
            ActivityLog.objects.create(
                user=request.user,
                action=f"Inventory Transfer: {quantity} of Product {product_id} from {from_branch_id} to {to_branch_id}",
                entity_type="inventory",
                entity_id=source_inv.id
            )

        return Response({"detail": "Transfer completed successfully"}, status=status.HTTP_200_OK)

# --- Purchase & Ordering ---

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all().prefetch_related('items__product')
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return self.queryset.filter(branch_id=self.request.user.branch_id)
        return self.queryset

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        purchase = self.get_object()
        if purchase.status == 'received':
            return Response({"detail": "Purchase already received"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            purchase.status = 'received'
            purchase.save()

            # For each purchase item, create ProductBatch and add to inventory
            for item in purchase.items.all():
                # Generate a batch for this received stock
                batch = ProductBatch.objects.create(
                    product=item.product,
                    supplier=purchase.supplier,
                    branch=purchase.branch,
                    batch_number=f"BAT-{purchase.id.hex[:6].upper()}",
                    manufacturing_date=date.today(),
                    expiry_date=date.today() + timedelta(days=365), # 1 year expiry default
                    quantity_received=item.quantity,
                    remaining_quantity=item.quantity,
                    purchase_price=item.cost_price
                )

                # Update main Inventory records
                inv, created = Inventory.objects.get_or_create(
                    product=item.product,
                    branch=purchase.branch,
                    defaults={'total_quantity': 0}
                )
                inv.total_quantity += item.quantity
                inv.save()

            # Write Audit Log
            ActivityLog.objects.create(
                user=request.user,
                action=f"Received Purchase PO-{purchase.id}",
                entity_type="purchase",
                entity_id=purchase.id
            )

        return Response(PurchaseSerializer(purchase).data, status=status.HTTP_200_OK)

# --- Sales Module ---

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().prefetch_related('items__product')
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, HasBranchAccess]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return self.queryset.filter(branch_id=self.request.user.branch_id)
        return self.queryset

    def perform_create(self, serializer):
        # Save cashier and branch automatically
        serializer.save(
            cashier=self.request.user,
            branch=self.request.user.branch if self.request.user.branch else serializer.validated_data.get('branch')
        )

# --- Customer Profiling View ---

class CustomerViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # Query unique customer names from sales records
        customers = Sale.objects.values('customer_name').annotate(
            total_spend=Sum('total_amount'),
            visit_count=Count('id')
        ).filter(customer_name__isnull=False).exclude(customer_name='')

        return Response(customers, status=status.HTTP_200_OK)

# --- Notifications View ---

class NotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Compile warnings: low stock levels and expiring batches
        branch_id = request.user.branch_id
        
        # Low stock products
        low_stock_query = Inventory.objects.filter(total_quantity__lt=F('product__min_stock_level'))
        if branch_id and request.user.role != 'admin':
            low_stock_query = low_stock_query.filter(branch_id=branch_id)
            
        low_stock_alerts = []
        for inv in low_stock_query.select_related('product', 'branch'):
            low_stock_alerts.append({
                "type": "low_stock",
                "title": f"Low Stock Alert: {inv.product.name}",
                "message": f"Branch: {inv.branch.name}. Current stock: {inv.total_quantity}, Reorder level: {inv.product.min_stock_level}.",
                "urgency": "critical" if inv.total_quantity == 0 else "warning",
                "unread": True
            })

        # Expiring products (expiring in next 30 days)
        expiry_limit = date.today() + timedelta(days=30)
        expiring_query = ProductBatch.objects.filter(expiry_date__lte=expiry_limit, remaining_quantity__gt=0)
        if branch_id and request.user.role != 'admin':
            expiring_query = expiring_query.filter(branch_id=branch_id)

        expiring_alerts = []
        for batch in expiring_query.select_related('product', 'branch'):
            expiring_alerts.append({
                "type": "expiry",
                "title": f"Product Expiring: {batch.product.name}",
                "message": f"Batch: {batch.batch_number} at {batch.branch.name} expires on {batch.expiry_date}. Qty: {batch.remaining_quantity}.",
                "urgency": "critical" if batch.expiry_date <= date.today() else "warning",
                "unread": True
            })

        return Response({
            "low_stock_alerts": low_stock_alerts,
            "expiring_alerts": expiring_alerts
        }, status=status.HTTP_200_OK)

# --- Optimized Analytics Dashboard ---

class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id')
        
        # User isolation check
        if request.user.role != 'admin':
            branch_id = request.user.branch_id

        # Filters
        sales_filter = Q()
        inventory_filter = Q()
        if branch_id:
            sales_filter &= Q(branch_id=branch_id)
            inventory_filter &= Q(branch_id=branch_id)

        # 1. Dashboard Metrics
        sales_aggregate = Sale.objects.filter(sales_filter).aggregate(
            total_revenue=Sum('total_amount'),
            total_sales_count=Count('id')
        )
        
        # Profit Calculation: Sum(SaleItem.quantity * (SaleItem.selling_price - Product.cost_price))
        profit_query = SaleItem.objects.filter(sale__branch_id=branch_id) if branch_id else SaleItem.objects.all()
        profit_aggregate = profit_query.annotate(
            cost=F('quantity') * F('product__cost_price'),
            revenue=F('quantity') * F('selling_price')
        ).aggregate(
            total_profit=Sum(F('revenue') - F('cost'))
        )

        inventory_value_aggregate = Inventory.objects.filter(inventory_filter).annotate(
            val=F('total_quantity') * F('product__cost_price')
        ).aggregate(
            total_value=Sum('val')
        )

        active_customers = Sale.objects.filter(sales_filter).values('customer_name').distinct().count()

        # 2. Charts: Daily Sales Trends (last 30 days)
        last_30_days = timezone.now() - timedelta(days=30)
        daily_sales = Sale.objects.filter(sales_filter, created_at__gte=last_30_days)\
            .annotate(day=TruncDay('created_at'))\
            .values('day')\
            .annotate(revenue=Sum('total_amount'))\
            .order_by('day')

        # 3. Monthly Sales Trends (last 12 months)
        last_year = timezone.now() - timedelta(days=365)
        monthly_sales = Sale.objects.filter(sales_filter, created_at__gte=last_year)\
            .annotate(month=TruncMonth('created_at'))\
            .values('month')\
            .annotate(revenue=Sum('total_amount'))\
            .order_by('month')

        # 4. Product performance (top selling)
        product_performance = profit_query.values('product__name').annotate(
            quantity_sold=Sum('quantity'),
            total_revenue=Sum(F('quantity') * F('selling_price'))
        ).order_by('-quantity_sold')[:5]

        # 5. Store/Branch Performance Comparison (only relevant for global admin dashboard)
        branch_performance = []
        if request.user.role == 'admin':
            branch_performance = Sale.objects.values('branch__name').annotate(
                revenue=Sum('total_amount'),
                sales_count=Count('id')
            ).order_by('-revenue')

        return Response({
            "metrics": {
                "revenue": sales_aggregate.get('total_revenue') or 0.00,
                "profit": profit_aggregate.get('total_profit') or 0.00,
                "sales_count": sales_aggregate.get('total_sales_count') or 0,
                "inventory_value": inventory_value_aggregate.get('total_value') or 0.00,
                "active_customers": active_customers
            },
            "charts": {
                "daily_sales": list(daily_sales),
                "monthly_sales": list(monthly_sales),
                "product_performance": list(product_performance),
                "branch_performance": list(branch_performance)
            }
        }, status=status.HTTP_200_OK)

# --- File Management: Supabase Storage Integration ---

class FileStorageSignedUrlView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_name = request.data.get('file_name')
        bucket_name = request.data.get('bucket_name', 'pos-assets')
        
        if not file_name:
            return Response({"detail": "file_name is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Supabase API endpoint configuration
        supabase_url = os.getenv("SUPABASE_URL", "https://your-supabase-project.supabase.co")
        supabase_key = os.getenv("SUPABASE_KEY", "your-service-role-key")

        # In production-grade flow, construct a secure signed URL request to Supabase Storage endpoint
        # Example POST to /storage/v1/object/sign/:bucket/:path
        # Return the signed URL to client
        import requests
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        sign_endpoint = f"{supabase_url}/storage/v1/object/sign/{bucket_name}/{file_name}"
        
        try:
            # Short-lived URL (expires in 15 minutes)
            api_response = requests.post(sign_endpoint, headers=headers, json={"expiresIn": 900})
            if api_response.status_code == 200:
                signed_url = api_response.json().get('signedURL')
                # Prepend domain if relative
                if signed_url and signed_url.startswith('/'):
                    signed_url = f"{supabase_url}{signed_url}"
                if signed_url:
                    return Response({"signed_url": signed_url}, status=status.HTTP_200_OK)
        except Exception as e:
            pass

        # Failover dummy URL for offline testing
        fallback_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{file_name}"
        return Response({"signed_url": fallback_url}, status=status.HTTP_200_OK)
