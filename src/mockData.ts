import { User, UserRole, Company, Store, Product, Category, Supplier, PurchaseOrder, SalesTransaction, Customer, Employee, SystemNotification } from "./types";

// Base logged-in user defaults
export const initialUsers: User[] = [
  {
    id: "U-001",
    name: "Marcus Sterling",
    email: "m.sterling@shopnest.com",
    role: UserRole.SUPER_ADMIN,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "U-002",
    name: "Elena Rodriguez",
    email: "e.rodriguez@shopnest.com",
    role: UserRole.COMPANY_MANAGER,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "U-003",
    name: "Jameson Chen",
    email: "j.chen@shopnest.com",
    role: UserRole.STORE_MANAGER,
    storeId: "STR-001",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "U-004",
    name: "Sarah Miller",
    email: "s.miller@shopnest.com",
    role: UserRole.CASHIER,
    storeId: "STR-002",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
  }
];

export const sampleCompany: Company = {
  id: "CMP-4820",
  name: "ShopNest Retail Corporation",
  registrationNumber: "US-CO-994827-Z",
  ownerName: "Marcus Sterling Sr.",
  address: "940 Enterprise Blvd, Suite 240, New York, NY 10001",
  phone: "+1 (800) 555-0199",
  taxNumber: "TX-482-990-11"
};

export const sampleStores: Store[] = [
  {
    id: "STR-001",
    name: "Downtown Flagship Hub",
    code: "STR-NYC-001",
    address: "50 Fifth Avenue, Flatiron, New York, NY 10010",
    phone: "+1 (212) 555-0145",
    managerId: "U-003",
    managerName: "Jameson Chen",
    dailySales: 12450.00,
    salesGrowth: 8.4,
    inventoryCount: 4280,
    inventoryCapacityPct: 82,
    status: "Online"
  },
  {
    id: "STR-002",
    name: "Westside Urban Store",
    code: "STR-LAX-002",
    address: "9421 Wilshire Blvd, Beverly Hills, Los Angeles, CA 90212",
    phone: "+1 (310) 555-0211",
    managerId: "U-002",
    managerName: "Elena Rodriguez",
    dailySales: 8210.00,
    salesGrowth: -1.2,
    inventoryCount: 1150,
    inventoryCapacityPct: 45,
    status: "Online"
  },
  {
    id: "STR-003",
    name: "Lakeside Plaza Center",
    code: "STR-CHI-003",
    address: "320 Michigan Ave, River North, Chicago, IL 60611",
    phone: "+1 (312) 555-0399",
    managerId: "E-005",
    managerName: "David Vance",
    dailySales: 6940.00,
    salesGrowth: 14.7,
    inventoryCount: 5120,
    inventoryCapacityPct: 94,
    status: "Online"
  },
  {
    id: "STR-004",
    name: "East Mall Kiosk",
    code: "STR-MIA-004",
    address: "140 Biscayne Blvd, Miami, FL 33132",
    phone: "+1 (305) 555-0450",
    managerId: "E-004",
    managerName: "Sarah Miller (Lead)",
    dailySales: 2190.00,
    salesGrowth: 3.2,
    inventoryCount: 420,
    inventoryCapacityPct: 62,
    status: "Maintenance"
  }
];

export const sampleCategories: Category[] = [
  { id: "CAT-001", name: "Premium Electronics", parentCategory: "Consumer Tech", totalProducts: 342, revenueGenerated: 189020.00 },
  { id: "CAT-002", name: "Artisanal Beverages", parentCategory: "Gourmet Food", totalProducts: 120, revenueGenerated: 42950.00 },
  { id: "CAT-003", name: "Athletic Wear", parentCategory: "Apparel", totalProducts: 215, revenueGenerated: 84320.00 },
  { id: "CAT-004", name: "Organic Dry Goods", parentCategory: "Gourmet Food", totalProducts: 480, revenueGenerated: 32410.00 },
  { id: "CAT-005", name: "Home Accessories", parentCategory: "Living & Decor", totalProducts: 127, revenueGenerated: 15300.00 }
];

export const sampleSuppliers: Supplier[] = [
  { id: "SPL-001", name: "Global Bean Importers Co.", phone: "+1 (800) 555-6611", email: "orders@globalbeans.com", address: "Seattle, WA, USA", licenseNumber: "LIC-BEANS-48A", outstandingBalance: 12450.00, fulfillmentRatePct: 98.4, status: "Preferred" },
  { id: "SPL-002", name: "Studio Sonic Tech LLC", phone: "+1 (888) 555-9022", email: "b2b@studiosonic.io", address: "San Jose, CA, USA", licenseNumber: "LIC-TECH-993K", outstandingBalance: 4280.00, fulfillmentRatePct: 94.2, status: "Preferred" },
  { id: "SPL-003", name: "Vanguard Athletics Ltd.", phone: "+1 (800) 555-3211", email: "sales@vanguardathletic.com", address: "Portland, OR, USA", licenseNumber: "LIC-VAN-115D", outstandingBalance: 0.00, fulfillmentRatePct: 88.7, status: "Standard" },
  { id: "SPL-004", name: "Apex Smart Living Corp", phone: "+1 (877) 555-8833", email: "distribution@apexliving.com", address: "Austin, TX, USA", licenseNumber: "LIC-APEX-77E", outstandingBalance: 24700.00, fulfillmentRatePct: 74.5, status: "Overdue" }
];

export const sampleProducts: Product[] = [
  {
    id: "PRD-001",
    name: "Artisan Roast: Ethiopia Yirgacheffe",
    sku: "COF-YIR-2024-01",
    barcode: "748201290334",
    category: "Artisanal Beverages",
    brand: "ShopNest Reserve",
    description: "Single-origin specialty medium roast coffee with prominent floral notes, jasmine aroma, and bright red berry acidity. Sourced ethically from the Yirgacheffe micro-region.",
    costPrice: 18.50,
    sellingPrice: 42.00,
    quantity: 1240,
    reorderLevel: 200,
    expiryDate: "2026-10-12",
    batchNumber: "BATCH-ETH-993",
    status: "Healthy",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80",
    supplierId: "SPL-001"
  },
  {
    id: "PRD-002",
    name: "AeroFlow Runner X1",
    sku: "SHO-RED-42-001",
    barcode: "884920485901",
    category: "Athletic Wear",
    brand: "Vanguard Athletics",
    description: "High-performance marathon running shoe with carbon-fiber energy propulsion plate and hyper-breathable engineered mesh upper.",
    costPrice: 65.00,
    sellingPrice: 129.99,
    quantity: 2,
    reorderLevel: 10,
    expiryDate: "2029-12-31",
    batchNumber: "B-VAN-X1-44",
    status: "Critical",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80",
    supplierId: "SPL-003"
  },
  {
    id: "PRD-003",
    name: "Horizon Smartwatch Elite",
    sku: "WTC-SIL-WHT-09",
    barcode: "192305781442",
    category: "Premium Electronics",
    brand: "Apex Smart Living",
    description: "Titanium aerospace grade dynamic hybrid fitness watch featuring critical body telemetry, sleep stage tracking, and standard 14-day battery reserve.",
    costPrice: 120.00,
    sellingPrice: 249.00,
    quantity: 156,
    reorderLevel: 15,
    status: "Healthy",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80",
    supplierId: "SPL-004"
  },
  {
    id: "PRD-004",
    name: "Organic Oat Clusters",
    sku: "FOD-OAT-400G",
    barcode: "284910394851",
    category: "Organic Dry Goods",
    brand: "Grain & Harvest",
    description: "Whole-grain organic gluten-free rolled oat clusters toasted with pure Canadian maple syrup and a delicate touch of premium Himalayan pink salt.",
    costPrice: 3.20,
    sellingPrice: 8.50,
    quantity: 42,
    reorderLevel: 50,
    expiryDate: "2026-06-16", // Soon!
    batchNumber: "B-GRAIN-OAT-12",
    status: "Expiring",
    imageUrl: "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?w=400&auto=format&fit=crop&q=80",
    supplierId: "SPL-001"
  },
  {
    id: "PRD-005",
    name: "Studio Pro Wireless ANC",
    sku: "AUD-HP-BLK-01",
    barcode: "503928174928",
    category: "Premium Electronics",
    brand: "Studio Sonic Tech",
    description: "Elite wireless over-ear noise-canceling headphones with studio monitoring sound signature, spatial acoustic custom tuning, and luxurious memory foam cups.",
    costPrice: 160.00,
    sellingPrice: 349.99,
    quantity: 28,
    reorderLevel: 5,
    status: "Healthy",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80",
    supplierId: "SPL-002"
  }
];

export const samplePurchaseOrders: PurchaseOrder[] = [
  { id: "PO-88291", supplierId: "SPL-001", supplierName: "Global Bean Importers Co.", itemCount: 500, totalAmount: 9250.00, createdByName: "Jameson Chen", createdAt: "2 hours ago", status: "PENDING", deliveryStatus: "Scheduled" },
  { id: "PO-88285", supplierId: "SPL-002", supplierName: "Studio Sonic Tech LLC", itemCount: 50, totalAmount: 8000.00, createdByName: "Marcus Sterling", createdAt: "3 days ago", status: "APPROVED", deliveryStatus: "In-Transit" },
  { id: "PO-88210", supplierId: "SPL-003", supplierName: "Vanguard Athletics Ltd.", itemCount: 120, totalAmount: 7800.00, createdByName: "Elena Rodriguez", createdAt: "1 week ago", status: "RECEIVED", deliveryStatus: "Arrived" }
];

export const sampleTransactions: SalesTransaction[] = [
  {
    id: "#TRX-9482",
    customerName: "Benjamin Cardozo",
    customerInitials: "BC",
    dateTime: "Today, 11:24 AM",
    amount: 512.48,
    paymentMethod: "Card",
    status: "Completed",
    items: [
      { productId: "PRD-005", productName: "Studio Pro Wireless ANC", sku: "AUD-HP-BLK-01", price: 349.99, quantity: 1 },
      { productId: "PRD-001", productName: "Artisan Roast: Ethiopia Yirgacheffe", sku: "COF-YIR-2024-01", price: 42.00, quantity: 3 },
      { productId: "PRD-004", productName: "Organic Oat Clusters", sku: "FOD-OAT-400G", price: 8.50, quantity: 4 }
    ]
  },
  {
    id: "#TRX-9480",
    customerName: "Charlotte Bronte",
    customerInitials: "CB",
    dateTime: "Today, 09:12 AM",
    amount: 129.99,
    paymentMethod: "Mobile",
    status: "Completed",
    items: [
      { productId: "PRD-002", productName: "AeroFlow Runner X1", sku: "SHO-RED-42-001", price: 129.99, quantity: 1 }
    ]
  },
  {
    id: "#TRX-9476",
    customerName: "David Thoreau",
    customerInitials: "DT",
    dateTime: "Yesterday, 04:30 PM",
    amount: 581.00,
    paymentMethod: "Cash",
    status: "Completed",
    items: [
      { productId: "PRD-003", productName: "Horizon Smartwatch Elite", sku: "WTC-SIL-WHT-09", price: 249.00, quantity: 2 },
      { productId: "PRD-001", productName: "Artisan Roast: Ethiopia Yirgacheffe", sku: "COF-YIR-2024-01", price: 42.00, quantity: 2 }
    ]
  },
  {
    id: "#TRX-9411",
    customerName: "Gabriel Garcia Marquez",
    customerInitials: "GM",
    dateTime: "June 07, 2026",
    amount: 349.99,
    paymentMethod: "Bank",
    status: "Refunded",
    items: [
      { productId: "PRD-005", productName: "Studio Pro Wireless ANC", sku: "AUD-HP-BLK-01", price: 349.99, quantity: 1 }
    ]
  }
];

export const sampleCustomers: Customer[] = [
  { id: "CST-001", name: "Benjamin Cardozo", phone: "+1 (646) 555-9011", email: "ben.cardozo@supremecourt.org", segment: "VIP Member", totalSpend: 4280.50, loyaltyPoints: 428 },
  { id: "CST-002", name: "Charlotte Bronte", phone: "+1 (213) 555-8812", email: "charlotte@bronte.lit", segment: "VIP Member", totalSpend: 2310.00, loyaltyPoints: 230 },
  { id: "CST-003", name: "David Thoreau", phone: "+1 (773) 555-7744", email: "walden@pond.me", segment: "Standard", totalSpend: 840.00, loyaltyPoints: 80 },
  { id: "CST-004", name: "Gabriel Garcia Marquez", phone: "+1 (305) 555-1004", email: "macondo@solitude.org", segment: "At Risk", totalSpend: 450.00, loyaltyPoints: 45 },
  { id: "CST-005", name: "Helena Blavatsky", phone: "+1 (212) 555-3333", email: "theosophy@nyc.org", segment: "New Client", totalSpend: 42.00, loyaltyPoints: 5 }
];

export const sampleEmployees: Employee[] = [
  { id: "EMP-001", name: "Marcus Sterling", phone: "+1 (212) 555-0011", email: "m.sterling@shopnest.com", role: "Super Admin", salary: 14500, storeId: "all", storeName: "All Stores (HQ)", joinedDate: "Jan 12, 2023", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
  { id: "EMP-002", name: "Elena Rodriguez", phone: "+1 (310) 555-0211", email: "e.rodriguez@shopnest.com", role: "Company Manager", salary: 9500, storeId: "all", storeName: "Regional Operations", joinedDate: "Feb 01, 2024", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" },
  { id: "EMP-003", name: "Jameson Chen", phone: "+1 (212) 555-0145", email: "j.chen@shopnest.com", role: "Store Manager", salary: 5200, storeId: "STR-001", storeName: "Downtown Flagship Hub", joinedDate: "Sep 15, 2024", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
  { id: "EMP-004", name: "Sarah Miller", phone: "+1 (305) 555-0450", email: "s.miller@shopnest.com", role: "Cashier Trainee", salary: 2800, storeId: "STR-002", storeName: "Westside Urban Store", joinedDate: "Nov 01, 2025", status: "Training", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
  { id: "EMP-005", name: "David Vance", phone: "+1 (312) 555-0399", email: "d.vance@shopnest.com", role: "Floor Supervisor", salary: 4500, storeId: "STR-003", storeName: "Lakeside Plaza Center", joinedDate: "Mar 10, 2025", status: "On Leave", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" }
];

export const sampleNotifications: SystemNotification[] = [
  {
    id: "NTF-001",
    type: "low_stock",
    title: "Critical Low Stock Alert",
    message: "AeroFlow Runner X1 (SKU: SHO-RED-42-001) has dropped to 2 units left. Reorder threshold is 10 units.",
    timestamp: "10 mins ago",
    urgency: "critical",
    unread: true,
    actionRequired: true,
    actionText: "Generate Purchase Order"
  },
  {
    id: "NTF-002",
    type: "expiry",
    title: "Batch Expiry Warning",
    message: "Organic Oat Clusters (Batch B-GRAIN-OAT-12) will expire on June 16, 2026 (7 Days). Action recommended: Mark down for Clearance Sale.",
    timestamp: "2 hours ago",
    urgency: "warning",
    unread: true,
    actionRequired: true,
    actionText: "Apply Clearance Markdown"
  },
  {
    id: "NTF-003",
    type: "purchase_order",
    title: "Approval Needed",
    message: "Purchase Order PO-88291 for Global Bean Importers Co. ($9,250.00) requires Super Admin / Company Manager approval.",
    timestamp: "3 hours ago",
    urgency: "warning",
    unread: true,
    actionRequired: true,
    actionText: "Review & Approve PO"
  },
  {
    id: "NTF-004",
    type: "inventory_transfer",
    title: "Inter-Store Stock Transfer Complete",
    message: "Transfer of 50 units of Artisan Roast: Ethiopia Yirgacheffe from Lakeside Plaza Center to Westside Urban Store has been received successfully.",
    timestamp: "Yesterday",
    urgency: "info",
    unread: false
  },
  {
    id: "NTF-005",
    type: "daily_sales",
    title: "Sales Target Achieved",
    message: "Downtown Flagship Hub has crossed the daily target of $10,000.00, clocking $12,450.00! Status: +8.4% WoW.",
    timestamp: "Yesterday",
    urgency: "info",
    unread: false
  }
];
