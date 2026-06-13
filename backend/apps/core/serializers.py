from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from decimal import Decimal
import re

from .models import (
    Branch, CustomUser, Category, Product, Supplier, 
    ProductBatch, Inventory, Purchase, PurchaseItem, Sale, SaleItem, ActivityLog
)

# --- Authentication & User Serializers ---

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email', 'role', 'branch', 'branch_name', 'created_at', 'password']
        read_only_fields = ['id', 'created_at']

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

# --- Branch Serializer ---

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location', 'created_at']
        read_only_fields = ['id', 'created_at']

# --- Category Serializer ---

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'parent_name', 'subcategories', 'created_at']
        read_only_fields = ['id', 'created_at']

# --- Product Serializer ---

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    quantity = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'category', 'category_name', 
            'brand', 'unit', 'cost_price', 'selling_price', 
            'min_stock_level', 'quantity', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_quantity(self, obj):
        # Sum total quantity across all branches
        inventory_records = obj.inventory_records.all()
        return sum(item.total_quantity for item in inventory_records)

    def validate_barcode(self, value):
        if not value:
            return value
        # Barcode format check (alphanumeric, min length 8)
        if not re.match(r'^[A-Za-z0-9]{8,15}$', value):
            raise serializers.ValidationError("Barcode must be alphanumeric and between 8 and 15 characters.")
        # Duplicate check
        exists = Product.objects.filter(barcode=value)
        if self.instance:
            exists = exists.exclude(pk=self.instance.pk)
        if exists.exists():
            raise serializers.ValidationError("Product with this barcode already exists.")
        return value

# --- Supplier Serializer ---

class SupplierSerializer(serializers.ModelSerializer):
    purchase_history_count = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'phone', 'email', 'address', 
            'purchase_history_count', 'outstanding_balance', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_purchase_history_count(self, obj):
        return obj.purchases.count()

    def get_outstanding_balance(self, obj):
        # Sum cost of pending or partial purchases
        purchases = obj.purchases.filter(status__in=['pending', 'partial'])
        return sum((p.total_cost or Decimal('0.00')) for p in purchases)

# --- Product Batch Serializer ---

class ProductBatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = ProductBatch
        fields = [
            'id', 'product', 'product_name', 'supplier', 'supplier_name', 
            'branch', 'branch_name', 'batch_number', 'manufacturing_date', 
            'expiry_date', 'quantity_received', 'remaining_quantity', 
            'purchase_price', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        if data.get('expiry_date') and data.get('manufacturing_date'):
            if data['expiry_date'] <= data['manufacturing_date']:
                raise serializers.ValidationError("Expiry date must be after manufacturing date.")
        return data

# --- Inventory Serializer ---

class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Inventory
        fields = ['id', 'product', 'product_name', 'barcode', 'branch', 'branch_name', 'total_quantity', 'updated_at']
        read_only_fields = ['id', 'updated_at']

# --- Purchase & Purchase Items Serializers ---

class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = PurchaseItem
        fields = ['id', 'product', 'product_name', 'quantity', 'cost_price']
        read_only_fields = ['id']

class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Purchase
        fields = ['id', 'supplier', 'supplier_name', 'branch', 'branch_name', 'total_cost', 'status', 'items', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        purchase = Purchase.objects.create(**validated_data)
        total_cost = Decimal('0.00')

        for item_data in items_data:
            cost = item_data.get('cost_price') or Decimal('0.00')
            qty = item_data.get('quantity')
            total_cost += cost * qty
            PurchaseItem.objects.create(purchase=purchase, **item_data)

        purchase.total_cost = total_cost
        purchase.save()
        return purchase

# --- Sales & Sale Items Serializers ---

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'batch', 'quantity', 'selling_price', 'product_name']
        read_only_fields = ['id']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    cashier_name = serializers.CharField(source='cashier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'invoice_number', 'branch', 'branch_name', 'cashier', 'cashier_name', 
            'customer_name', 'total_amount', 'discount', 'tax', 
            'payment_method', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'total_amount', 'created_at']

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Sale must contain at least one item.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Auto-generate unique invoice number
        import random
        validated_data['invoice_number'] = f"INV-{random.randint(100000, 999999)}"
        
        sale = Sale.objects.create(**validated_data)
        
        subtotal = Decimal('0.00')
        tax_rate = Decimal('0.15') # 15% Standard Tax
        discount = validated_data.get('discount') or Decimal('0.00')
        
        for item_data in items_data:
            product = item_data['product']
            batch = item_data.get('batch')
            quantity = item_data['quantity']
            
            # Use products selling price if not specified
            price = item_data.get('selling_price') or product.selling_price or Decimal('0.00')
            subtotal += price * quantity
            
            SaleItem.objects.create(
                sale=sale,
                product=product,
                batch=batch,
                quantity=quantity,
                selling_price=price
            )
            
            # Inventory deduction
            if batch:
                batch.remaining_quantity = max(0, batch.remaining_quantity - quantity)
                batch.save()
            
            # Update total inventory record
            inv, created = Inventory.objects.get_or_create(
                product=product,
                branch=sale.branch,
                defaults={'total_quantity': 0}
            )
            inv.total_quantity = max(0, inv.total_quantity - quantity)
            inv.save()
            
        # Total Amount calculations
        calculated_tax = (subtotal - discount) * tax_rate
        if calculated_tax < 0:
            calculated_tax = Decimal('0.00')
            
        sale.tax = calculated_tax
        sale.total_amount = subtotal - discount + calculated_tax
        sale.save()
        
        return sale

# --- Activity Log Serializer ---

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'action', 'entity_type', 'entity_id', 'created_at']
        read_only_fields = ['id', 'created_at']
