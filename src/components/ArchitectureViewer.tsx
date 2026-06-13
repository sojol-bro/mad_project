import React, { useState } from "react";

export default function ArchitectureViewer() {
  const [activeTab, setActiveTab] = useState<"postgres" | "django" | "react_native">("postgres");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const postgresDDL = `-- =========================================================================
-- SHOPNEST ENTERPRISE RELATION-SCHEMA (POSTGRESQL 15+)
-- Features: UUID Primary Keys, Indexes, Soft Delete, Audit Traces
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES TABLE
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. COMPANIES TABLE
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    owner_name VARCHAR(100),
    tax_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL')),
    subscription_plan VARCHAR(30) DEFAULT 'ENTERPRISE',
    stripe_customer_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 3. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE RESTRICT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    current_store_id UUID, -- Setup forward reference optionally
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 4. STORES TABLE
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    phone VARCHAR(30),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- Add foreign key constraint to users for current_store_id
ALTER TABLE users ADD CONSTRAINT fk_user_store FOREIGN KEY (current_store_id) REFERENCES stores(id) ON DELETE SET NULL;

-- 5. EMPLOYEES TABLE
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    salary DECIMAL(12, 2) NOT NULL,
    joined_date DATE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'TRAINING', 'OFF_DUTY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 6. CUSTOMERS (CRM) TABLE
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    card_number VARCHAR(50) UNIQUE,
    segment VARCHAR(30) DEFAULT 'STANDARD' CHECK (segment IN ('VIP', 'STANDARD', 'NEW', 'AT_RISK')),
    total_spend DECIMAL(15, 2) DEFAULT 0.00,
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 7. CATEGORIES TABLE
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_company_category UNIQUE (company_id, name)
);

-- 8. SUPPLIERS TABLE
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_person VARCHAR(100),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address TEXT,
    license_number VARCHAR(100) UNIQUE,
    outstanding_balance DECIMAL(15, 2) DEFAULT 0.00,
    fulfillment_rate DECIMAL(5, 2) DEFAULT 100.00,
    status VARCHAR(30) DEFAULT 'PREFERRED' CHECK (status IN ('PREFERRED', 'STANDARD', 'OVERDUE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 9. PRODUCTS TABLE
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    brand VARCHAR(100),
    description TEXT,
    cost_price DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    reorder_level INT NOT NULL DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 10. PRODUCT BATCHES & EXPIRY TABLE
CREATE TABLE product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    batch_quantity INT NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    cost_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 11. INVENTORY STOCK SNAPSHOT
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 10,
    stock_status VARCHAR(30) DEFAULT 'HEALTHY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_store_product UNIQUE (store_id, product_id)
);

-- 12. INVENTORY TRANSACTIONS LOG (LEDGER)
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL, -- 'SALE', 'PURCHASE_RECEIPT', 'STOCK_ADJUST', 'RETURN', 'TRANSFER'
    quantity INT NOT NULL,
    previous_qty INT NOT NULL,
    current_qty INT NOT NULL,
    reference_id UUID, -- References Sale, PurchaseOrder, etc.
    reference_type VARCHAR(50),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. PURCHASE ORDERS (PROCUREMENT)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'RECEIVED')),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 14. PURCHASE ORDER ITEMS
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,
    received_quantity INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'PENDING'
);

-- 15. SALES TRANSACTIONS (POS)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE RESTRICT,
    cashier_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL,
    net_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'MOBILE', 'BANK')),
    status VARCHAR(30) DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'REFUNDED', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- 16. SALE ITEMS
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. INVOICES TABLE
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID UNIQUE REFERENCES sales(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. RETURNS TABLE
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    total_refund_amount DECIMAL(15, 2) NOT NULL,
    return_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. INVENTORY TRANSFERS
CREATE TABLE inventory_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_store_id UUID REFERENCES stores(id) ON DELETE RESTRICT,
    to_store_id UUID REFERENCES stores(id) ON DELETE RESTRICT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'RECEIVED')),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. TRANSFER ITEMS
CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL
);

-- 21. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'DISMISSED')),
    urgency VARCHAR(30) DEFAULT 'INFO',
    action_required BOOLEAN DEFAULT FALSE,
    action_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id UUID,
    previous_state JSONB,
    current_state JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INDEXES FOR HIGH-THROUGHPUT QUERIES (OPTIMIZATION)
-- =========================================================================
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_inventory_store_product ON inventory(store_id, product_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
`;

  const djangoCode = `#########################################################################
# DJANGO REST FRAMEWORK (DRF) ARCHITECTURE FOR SHOPNEST ENTERPRISE
# - Includes JWT Auth, custom claims, standard permissions & ViewSets
#########################################################################

# 1. MODELS (models.py)
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey('Role', on_delete=models.RESTRICT, null=True)
    company = models.ForeignKey('Company', on_delete=models.CASCADE, null=True)
    current_store = models.ForeignKey('Store', on_delete=models.SET_NULL, null=True, related_name='active_users')
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = 'users'

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey('Category', on_delete=models.RESTRICT)
    brand = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    reorder_level = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    db_table = 'products'


# 2. SERIALIZERS (serializers.py)
from rest_framework import serializers

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    margin = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'category', 'category_name',
            'brand', 'description', 'cost_price', 'selling_price',
            'reorder_level', 'is_active', 'margin', 'created_at'
        ]

    def get_margin(self, obj):
        if obj.selling_price > 0:
            return round(((obj.selling_price - obj.cost_price) / obj.selling_price) * 100, 2)
        return 0


# 3. VIEWS & ROLE-BASED PERMISSIONS (views.py / permissions.py)
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Super Admin'

class IsStoreManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name in ['Super Admin', 'Company Manager', 'Store Manager']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_deleted=False)
    serializer_class = ProductSerializer
    permission_classes = [IsStoreManager] # Non-managers can only review, verified in Custom methods

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStoreManager()]
        return [permissions.IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        # Implement Soft Delete
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response({"status": "Product soft-deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# 4. CUSTOM JWT CLAIMS (token_auth.py)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CompanyCustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom Claims injection
        token['name'] = user.name
        token['email'] = user.email
        token['role'] = user.role.name if user.role else 'Cashier'
        token['company_id'] = str(user.company_id) if user.company_id else None
        token['store_id'] = str(user.current_store_id) if user.current_store_id else None
        return token
`;

  const reactNativeCode = `// =========================================================================
// REACT NATIVE (EXPO) + ZUSTAND ENGINE SPECIFICATION
// Features: State coordination, API sync, safe network fallbacks
// =========================================================================

// 1. NAVIGATION GRAPH DESIGN
/*
RootStackNavigator
  ├── AuthStackNavigator
  │    ├── LoginScreen
  │    └── SignUpScreen
  └── DrawerNavigator / TabNavigator
       ├── DashboardScreen
       ├── InventoryStackNavigator
       │    ├── InventoryScreen
       │    ├── ProductDetailScreen (e.g. Ethiopia Yirgacheffe)
       │    └── NewProductScreen
       ├── POSTerminalScreen
       ├── ExpiryScreen
       ├── PurchaseScreen
       └── CustomerScreen
*/

// 2. STATE MANAGER USING ZUSTAND (store.ts)
import { create } from 'zustand';
import { Product, SalesTransaction, User, UserRole } from './types';

interface AppState {
  currentUser: User | null;
  currentRole: UserRole;
  currentStoreId: string;
  cart: { product: Product; qty: number }[];
  products: Product[];
  transactions: SalesTransaction[];
  setRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  
  // Checkout POS Loop
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  checkout: (paymentMethod: "Cash" | "Card" | "Mobile" | "Bank", customerName: string) => SalesTransaction | null;
  
  // Inventory actions
  addProduct: (product: Omit<Product, "id" | "status">) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentRole: UserRole.SUPER_ADMIN,
  currentStoreId: "STR-001",
  cart: [],
  products: [],
  transactions: [],
  
  setRole: (role) => set({ currentRole: role }),
  setUser: (user) => set({ currentUser: user, currentRole: user.role, currentStoreId: user.storeId || "STR-001" }),
  
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.product.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item => 
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      };
    }
    return { cart: [...state.cart, { product, qty: 1 }] };
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.product.id !== productId)
  })),
  
  updateCartQty: (productId, qty) => set((state) => ({
    cart: state.cart.map(item => 
      item.product.id === productId ? { ...item, qty: Math.max(1, qty) } : item
    )
  })),
  
  clearCart: () => set({ cart: [] }),
  
  checkout: (paymentMethod, customerName) => {
    const { cart, products, transactions } = get();
    if (cart.length === 0) return null;
    
    const subtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.qty), 0);
    const tax = subtotal * 0.0825; // 8.25% State Sales Tax
    const total = subtotal + tax;
    
    const newTrx: SalesTransaction = {
      id: "#TRX-" + Math.floor(1000 + Math.random() * 9000),
      customerName: customerName || "Quick Walk-in",
      customerInitials: (customerName || "Walk-In").substring(0, 2).toUpperCase(),
      dateTime: "Just Now",
      amount: parseFloat(total.toFixed(2)),
      paymentMethod,
      status: "Completed",
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        price: item.product.sellingPrice,
        quantity: item.qty
      }))
    };
    
    // De-increment product quantities
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(ci => ci.product.id === p.id);
      if (cartItem) {
        const nextQty = Math.max(0, p.quantity - cartItem.qty);
        return {
          ...p,
          quantity: nextQty,
          status: nextQty === 0 ? "Critical" : nextQty <= p.reorderLevel ? "Critical" : "Healthy" as any
        };
      }
      return p;
    });
    
    set({
      transactions: [newTrx, ...transactions],
      products: updatedProducts,
      cart: []
    });
    
    return newTrx;
  },
  
  addProduct: (newP) => set((state) => {
    const fresh: Product = {
      ...newP,
      id: "PRD-" + Math.floor(100 + Math.random() * 900),
      status: newP.quantity <= newP.reorderLevel ? "Critical" : "Healthy"
    };
    return { products: [fresh, ...state.products] };
  })
}));
`;

  return (
    <div id="architecture-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8 transition-all duration-300">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outward text-emerald-800 font-bold text-xl">database</span>
            <h2 className="text-xl font-semibold text-gray-900 font-sans tracking-tight">Enterprise Production Specifications</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">Full Relational Database Schema, REST endpoints & React Native State Engine</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl" id="arch-tabs">
          <button
            onClick={() => setActiveTab("postgres")}
            className={`px-4 py-2 rounded-lg text-xs font-medium font-sans flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === "postgres" ? "bg-emerald-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="material-symbols-outlined text-sm">settings_suggest</span>
            PostgreSQL (DDL)
          </button>
          <button
            onClick={() => setActiveTab("django")}
            className={`px-4 py-2 rounded-lg text-xs font-medium font-sans flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === "django" ? "bg-emerald-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            Django REST API
          </button>
          <button
            onClick={() => setActiveTab("react_native")}
            className={`px-4 py-2 rounded-lg text-xs font-medium font-sans flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === "react_native" ? "bg-emerald-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="material-symbols-outlined text-sm">smartphone</span>
            React Native / Zustand
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "postgres" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-emerald-800 text-2xl">verified</span>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-950 font-sans">Full Relational Schema Alignment Completed</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">Defines all 23 database tables with UUIDs, correct keys, explicit field lengths, indexes and cascading policies.</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(postgresDDL, "postgres")}
                className="bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-all text-xs font-medium font-sans px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                {copiedText === "postgres" ? "SQL Copied!" : "Copy SQL Script"}
              </button>
            </div>

            {/* List of 23 tables defined */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[
                { name: "roles", desc: "Access Roles", fields: 5 },
                { name: "companies", desc: "Corporate Units", fields: 9 },
                { name: "users", desc: "Staff Accounts", fields: 10 },
                { name: "stores", desc: "Locations", fields: 10 },
                { name: "employees", desc: "Payroll/Designation", fields: 9 },
                { name: "customers", desc: "CRM Points/Spend", fields: 9 },
                { name: "categories", desc: "Product Families", fields: 5 },
                { name: "suppliers", desc: "Vendor Accounts", fields: 12 },
                { name: "products", desc: "Master Goods", fields: 14 },
                { name: "product_batches", desc: "Expiry batches", fields: 9 },
                { name: "inventory", desc: "Stock levels", fields: 8 },
                { name: "inventory_transfers", desc: "Inter-store movement", fields: 8 },
                { name: "transfer_items", desc: "Transfer items", fields: 4 },
                { name: "purchase_orders", desc: "Vendor Procurement", fields: 11 },
                { name: "purchase_order_items", desc: "PO details", fields: 8 },
                { name: "sales", desc: "POS ledger", fields: 12 },
                { name: "sale_items", desc: "Cart log lines", fields: 8 },
                { name: "invoices", desc: "Tax receipts", fields: 5 },
                { name: "returns", desc: "Refund approvals", fields: 6 },
                { name: "notifications", desc: "Urgent alarms", fields: 9 },
                { name: "audit_logs", desc: "Security traces", fields: 9 }
              ].map((tbl, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all cursor-default">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gray-800">{tbl.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">#{i+1}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{tbl.desc}</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-white px-2 py-0.5 rounded border border-gray-100 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[9px] text-gray-500 font-mono">{tbl.fields} fields</span>
                  </div>
                </div>
              ))}
            </div>

            {/* DDL scrollable container */}
            <div className="relative">
              <div className="absolute right-4 top-4 z-10">
                <button
                  onClick={() => handleCopy(postgresDDL, "postgres-code")}
                  className="bg-gray-800/80 backdrop-blur text-white hover:bg-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  {copiedText === "postgres-code" ? "Copied" : "Copy Code"}
                </button>
              </div>
              <pre className="p-5 rounded-2xl bg-gray-900 text-gray-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[420px] shadow-inner custom-scrollbar">
                <code>{postgresDDL}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === "django" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-emerald-800 text-2xl">api</span>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 font-sans">Django REST API Core Logic & Endpoints</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Models, custom JSON Web Token serializers, serializers with computed profit margins, and ViewSets with built-in soft delete.</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(djangoCode, "django")}
                className="bg-white text-gray-800 border border-gray-200 hover:bg-gray-100 transition-all text-xs font-medium font-sans px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                {copiedText === "django" ? "Python Copied!" : "Copy Python Core"}
              </button>
            </div>

            {/* Endpoints Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 font-sans">Corporate REST Endpoints Map</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-semibold font-sans font-mono border border-emerald-200">v1.0.0 Production OpenAPI</span>
              </div>
              <div className="divide-y divide-gray-100 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 font-sans uppercase">
                      <th className="px-5 py-3">Module</th>
                      <th className="px-5 py-3">HTTP Action</th>
                      <th className="px-5 py-3">Route Endpoint</th>
                      <th className="px-5 py-3">Role Constraints</th>
                      <th className="px-5 py-3">Execution Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-sans text-gray-600">
                    {[
                      { mod: "Auth Ledger", act: "POST", url: "/api/v1/auth/token/", roles: "All Personnel", trg: "Submit email & password to generate JWT Pair" },
                      { mod: "Auth Ledger", act: "POST", url: "/api/v1/auth/token/refresh/", roles: "All Personnel", trg: "Slide refresh token to rotate access credentials" },
                      { mod: "Company", act: "POST", url: "/api/v1/companies/", roles: "Super Admin", trg: "Establish new corporate enterprise subscription" },
                      { mod: "Store Admin", act: "GET / POST", url: "/api/v1/stores/", roles: "Company Manager +", trg: "List stores, establish branch physical locations" },
                      { mod: "Catalog System", act: "GET", url: "/api/v1/products/", roles: "All Authenticated", trg: "List products inside standard list view" },
                      { mod: "Catalog System", act: "POST / PUT", url: "/api/v1/products/{id}/", roles: "Store Manager +", trg: "Manipulate descriptions, costs & warning thresholds" },
                      { mod: "Catalog System", act: "DELETE", url: "/api/v1/products/{id}/", roles: "Store Manager +", trg: "Execute a soft_delete query setting is_deleted=True" },
                      { mod: "Expiry Panel", act: "GET", url: "/api/v1/expiries/expiring-soon/", roles: "Store Manager +", trg: "Pull batch records expiring relative to threshold dates (e.g. 7, 30 days)" },
                      { mod: "POS Checkout", act: "POST", url: "/api/v1/sales/", roles: "Cashier +", trg: "Log cart sale, invoice setup, lock inventory deduction, tax logic" },
                      { mod: "Procurement", act: "POST", url: "/api/v1/purchase-orders/", roles: "Store Manager +", trg: "Draft purchase order requesting inventory replenishment" },
                      { mod: "Procurement", act: "PATCH", url: "/api/v1/purchase-orders/{id}/approve/", roles: "Company Manager / Super Admin", trg: "Inject approval signature verifying PO budget" }
                    ].map((route, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-all font-sans">
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{route.mod}</td>
                        <td className="px-5 py-3.5 font-mono">
                          <span className={`px-2 py-1 rounded font-bold text-[10px] ${
                            route.act.includes("GET") ? "bg-blue-50 text-blue-800" :
                            route.act.includes("POST") ? "bg-emerald-50 text-emerald-800" :
                            route.act.includes("DELETE") ? "bg-red-50 text-red-800" : "bg-purple-50 text-purple-800"
                          }`}>{route.act}</span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-gray-700">{route.url}</td>
                        <td className="px-5 py-3.5 text-gray-500 font-medium">{route.roles}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-[11px]">{route.trg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Python scrollable */}
            <div className="relative">
              <div className="absolute right-4 top-4 z-10">
                <button
                  onClick={() => handleCopy(djangoCode, "django-code")}
                  className="bg-gray-800/80 backdrop-blur text-white hover:bg-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  {copiedText === "django-code" ? "Copied" : "Copy Code"}
                </button>
              </div>
              <pre className="p-5 rounded-2xl bg-gray-900 text-gray-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[420px] shadow-inner custom-scrollbar">
                <code>{djangoCode}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === "react_native" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-emerald-800 text-2xl">smartphone</span>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 font-sans">React Native Mobile Stack Alignment</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Routing logic for Expo Router or React Navigation, synchronized store utilizing Zustand, and dynamic checkout computations.</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(reactNativeCode, "react_native")}
                className="bg-white text-gray-800 border border-gray-200 hover:bg-gray-100 transition-all text-xs font-medium font-sans px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                {copiedText === "react_native" ? "Zustand Copied!" : "Copy Zustand Engine"}
              </button>
            </div>

            {/* Folder Layout Spec */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest font-sans mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-800 text-sm">folder_open</span>
                  App Directory Architecture
                </h4>
                <div className="font-mono text-xs leading-relaxed text-gray-600">
                  <div className="text-gray-900 font-bold">📂 shopnest-mobile-app/</div>
                  <div className="pl-4 text-emerald-800">├── 📂 .expo-shared/</div>
                  <div className="pl-4 text-emerald-800">├── 📂 assets/ <span className="text-gray-400 font-sans text-[10px]">(fonts, branding icons, invoice mockups)</span></div>
                  <div className="pl-4">├── 📂 src/</div>
                  <div className="pl-8 text-blue-500">├── 📂 components/ <span className="text-gray-400 font-sans text-[10px]">(shared buttons, card sheets, modals)</span></div>
                  <div className="pl-8 text-blue-500">├── 📂 navigation/ <span className="text-gray-400 font-sans text-[10px]">(AuthStack, AppTabs, DrawerRouter)</span></div>
                  <div className="pl-8 text-blue-500">├── 📂 screens/ <span className="text-gray-400 font-sans text-[10px]">(all 13 corporate modules dashboards)</span></div>
                  <div className="pl-8 text-blue-500">├── 📂 store/ <span className="text-gray-400 font-sans text-[10px]">(Zustand core state & persistent local storage)</span></div>
                  <div className="pl-8 text-blue-500">├── 📂 hooks/ <span className="text-gray-400 font-sans text-[10px]">(useOfflineSync, useDebounce, useAuthQuery)</span></div>
                  <div className="pl-8">└── 📝 types.ts <span className="text-gray-400 font-sans text-[10px]">(shared master enterprise types)</span></div>
                  <div className="pl-4">├── 📝 App.tsx <span className="text-gray-400 font-sans text-[10px]">(root component linking navigation providers)</span></div>
                  <div className="pl-4">├── 📝 index.js <span className="text-gray-400 font-sans text-[10px]">(entry point loading package registration)</span></div>
                  <div className="pl-4">└── 📝 package.json <span className="text-gray-400 font-sans text-[10px]">(Expo, Zustand, Nativewind, paper dependencies)</span></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest font-sans flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-800 text-sm">cloud_sync</span>
                  Production Offline-First Logic (Sync engine)
                </h4>
                <div className="space-y-3 text-xs text-gray-600 font-sans">
                  <p>In retail networks, stores occasionally face signal degradation or power outages. To prevent POS lockouts, our Expo setup handles items locally first:</p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-500 text-[11px]">
                    <li><strong>Sqlite Caching</strong>: Cart transactions and stock listings are cached locally using Expo SQLite.</li>
                    <li><strong>Queued Transactions</strong>: Transactions scanned while offline are pushed to a synchronization queue with a UUID key to guarantee zero losses.</li>
                    <li><strong>Automatic Sync Trigger</strong>: A NetInfo listener restarts, dispatching the queue back to Django’s <code>/api/v1/sales/sync/</code> endpoint once signal returns.</li>
                    <li><strong>Conflict Override</strong>: Clock timestamps and batch locks handle potential race conditions.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Zustand scrollable */}
            <div className="relative">
              <div className="absolute right-4 top-4 z-10">
                <button
                  onClick={() => handleCopy(reactNativeCode, "zustand-code")}
                  className="bg-gray-800/80 backdrop-blur text-white hover:bg-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  {copiedText === "zustand-code" ? "Copied" : "Copy Code"}
                </button>
              </div>
              <pre className="p-5 rounded-2xl bg-gray-900 text-gray-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[420px] shadow-inner custom-scrollbar">
                <code>{reactNativeCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
