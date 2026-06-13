import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)

class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField()
    location = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'branches'

    def __str__(self):
        return self.name

class CustomUser(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField()
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255, db_column='password_hash')
    role = models.CharField(
        max_length=50, 
        choices=[
            ('admin', 'admin'), 
            ('manager', 'manager'), 
            ('cashier', 'cashier'), 
            ('stock', 'stock')
        ]
    )
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, db_column='branch_id', related_name='users')
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    # Django specific staff/active status
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.name} ({self.role})"

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, db_column='parent_id', related_name='subcategories')
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField()
    barcode = models.TextField(unique=True, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, db_column='category_id', related_name='products')
    brand = models.TextField(null=True, blank=True)
    unit = models.TextField(null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    min_stock_level = models.IntegerField(default=0, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name

class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField()
    phone = models.TextField(null=True, blank=True)
    email = models.TextField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'suppliers'

    def __str__(self):
        return self.name

class ProductBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, db_column='product_id', related_name='batches')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, db_column='supplier_id', related_name='batches')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, db_column='branch_id', related_name='batches')
    batch_number = models.TextField(null=True, blank=True)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    quantity_received = models.IntegerField()
    remaining_quantity = models.IntegerField()
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'product_batches'

    def __str__(self):
        return f"Batch {self.batch_number} - {self.product.name if self.product else 'Unknown'}"

class Inventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, db_column='product_id', related_name='inventory_records')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, db_column='branch_id', related_name='inventory_records')
    total_quantity = models.IntegerField(default=0, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = 'inventory'
        unique_together = ('product', 'branch')

    def __str__(self):
        return f"{self.product.name if self.product else 'Unknown'} at {self.branch.name if self.branch else 'Unknown'}"

class Purchase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, db_column='supplier_id', related_name='purchases')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, db_column='branch_id', related_name='purchases')
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.TextField(choices=[('pending', 'pending'), ('partial', 'partial'), ('received', 'received')], null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'purchases'

    def __str__(self):
        return f"Purchase PO-{self.id} Status: {self.status}"

class PurchaseItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, null=True, db_column='purchase_id', related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, db_column='product_id', related_name='purchase_items')
    quantity = models.IntegerField()
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'purchase_items'

class Sale(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.TextField(unique=True, null=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, db_column='branch_id', related_name='sales')
    cashier = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, db_column='cashier_id', related_name='sales')
    customer_name = models.TextField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    payment_method = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'sales'

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.total_amount}"

class SaleItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, null=True, db_column='sale_id', related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, db_column='product_id', related_name='sale_items')
    batch = models.ForeignKey(ProductBatch, on_delete=models.SET_NULL, null=True, db_column='batch_id', related_name='sale_items')
    quantity = models.IntegerField()
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'sale_items'

class ActivityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, db_column='user_id', related_name='activity_logs')
    action = models.TextField(null=True, blank=True)
    entity_type = models.TextField(null=True, blank=True)
    entity_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'activity_logs'

    def __str__(self):
        return f"{self.user.name if self.user else 'System'} - {self.action} on {self.entity_type}"
