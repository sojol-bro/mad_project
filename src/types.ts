export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  COMPANY_MANAGER = "Company Manager",
  STORE_MANAGER = "Store Manager",
  CASHIER = "Cashier"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId?: string;
  avatarUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  ownerName: string;
  address: string;
  phone: string;
  taxNumber: string;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  managerId: string;
  managerName: string;
  dailySales: number;
  salesGrowth: number; // percentage
  inventoryCount: number;
  inventoryCapacityPct: number;
  status: "Online" | "Offline" | "Maintenance";
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  expiryDate?: string; // YYYY-MM-DD
  batchNumber?: string;
  status: "Critical" | "Healthy" | "Expiring";
  imageUrl?: string;
  supplierId?: string;
}

export interface Category {
  id: string;
  name: string;
  parentCategory?: string;
  totalProducts: number;
  revenueGenerated: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  outstandingBalance: number;
  fulfillmentRatePct: number;
  status: "Preferred" | "Standard" | "Overdue";
}

export interface PurchaseOrder {
  id: string; // e.g. PO-88291
  supplierId: string;
  supplierName: string;
  itemCount: number;
  totalAmount: number;
  createdByName: string;
  createdAt: string; // human-readable relative time
  status: "PENDING" | "APPROVED" | "RECEIVED";
  deliveryStatus?: "Arrived" | "In-Transit" | "Scheduled";
}

export interface TransactionItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
}

export interface SalesTransaction {
  id: string; // e.g. #TRX-9482
  customerName: string;
  customerInitials: string;
  dateTime: string;
  amount: number;
  paymentMethod: "Cash" | "Card" | "Mobile" | "Bank";
  status: "Completed" | "Refunded" | "Pending";
  items: TransactionItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  segment: "VIP Member" | "Standard" | "New Client" | "At Risk";
  totalSpend: number;
  loyaltyPoints: number;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: number;
  storeId: string;
  storeName: string;
  joinedDate: string;
  status: "Active" | "On Leave" | "Training" | "Off Duty";
  avatarUrl?: string;
}

export interface SystemNotification {
  id: string;
  type: "low_stock" | "expiry" | "purchase_order" | "inventory_transfer" | "daily_sales";
  title: string;
  message: string;
  timestamp: string;
  urgency: "critical" | "warning" | "info";
  unread: boolean;
  actionRequired?: boolean;
  actionText?: string;
}
