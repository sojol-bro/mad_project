import React, { useState } from "react";
import { User, UserRole, Store, Product, Category, Supplier, PurchaseOrder, SalesTransaction, Customer, Employee, SystemNotification } from "./types";
import { initialUsers, sampleCompany, sampleStores, sampleCategories, sampleSuppliers, sampleProducts, samplePurchaseOrders, sampleTransactions, sampleCustomers, sampleEmployees, sampleNotifications } from "./mockData";

// Module Imports
import DashboardModule from "./components/DashboardModule";
import InventoryModule from "./components/InventoryModule";
import POSModule from "./components/POSModule";
import ExpiryModule from "./components/ExpiryModule";
import EnterpriseAdminModules from "./components/EnterpriseAdminModules";
import ArchitectureViewer from "./components/ArchitectureViewer";

export default function App() {
  // Session Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); // default Marcus Sterling
  const [authView, setAuthView] = useState<"login" | "signup">("login");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>(UserRole.CASHIER);
  const [signupStore, setSignupStore] = useState("STR-001");

  // Database core state (React reactive memory)
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [transactions, setTransactions] = useState<SalesTransaction[]>(sampleTransactions);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(samplePurchaseOrders);
  const [notifications, setNotifications] = useState<SystemNotification[]>(sampleNotifications);
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(sampleSuppliers);

  // Active Screen Tab routing
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Dynamic state updates (used across all modules)
  
  // 1. ADD NEW PRODUCT FROM INVENTORY FORM
  const handleAddProduct = (newP: Omit<Product, "id" | "status">) => {
    const isCritical = newP.quantity <= newP.reorderLevel;
    const fresh: Product = {
      ...newP,
      id: "PRD-" + Math.floor(100 + Math.random() * 900),
      status: isCritical ? "Critical" : "Healthy"
    };
    
    setProducts([fresh, ...products]);

    // Push audit logs warning representation
    const freshLog: SystemNotification = {
      id: "NTF-PRD-" + Math.floor(1000 + Math.random() * 9000),
      type: "inventory_transfer",
      title: "New Item Registered",
      message: `${newP.name} [SKU: ${newP.sku}] added to catalog with initial stock of ${newP.quantity} units.`,
      timestamp: "Just Now",
      urgency: "info",
      unread: true
    };
    setNotifications([freshLog, ...notifications]);
  };

  // 2. QUANTITY ADJUSTMENT SLIDER IN PRODUCT INSPECTOR
  const handleUpdateProductQty = (productId: string, newQty: number) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const isCritical = newQty <= p.reorderLevel;
        return {
          ...p,
          quantity: newQty,
          status: isCritical ? "Critical" : "Healthy"
        };
      }
      return p;
    }));
  };

  // 3. POS CASH DRAWER CHECKOUT
  const handlePOSCheckout = (paymentMethod: "Cash" | "Card" | "Mobile" | "Bank", customerNameStr: string) => {
    // Collect cart total
    let totalAmt = 0;
    const itemLogs = products.filter(p => p.quantity < 0); // placeholder logic

    const activeTrx: SalesTransaction = {
      id: "#TRX-" + Math.floor(1000 + Math.random() * 9000),
      customerName: customerNameStr || "Quick Walk-In",
      customerInitials: (customerNameStr || "Walk-In").substring(0, 2).toUpperCase(),
      dateTime: "Just Now",
      amount: 412.00, // standard aggregate
      paymentMethod,
      status: "Completed",
      items: [
        { productId: "PRD-001", productName: "Artisan Roast: Ethiopia Yirgacheffe", sku: "COF-YIR-2024-01", price: 42.00, quantity: 2 },
        { productId: "PRD-003", productName: "Horizon Smartwatch Elite", sku: "WTC-SIL-WHT-09", price: 249.00, quantity: 1 }
      ]
    };

    // De-increment inventories
    setProducts(products.map(p => {
      if (p.id === "PRD-001") {
        const nextQty = Math.max(0, p.quantity - 2);
        return { ...p, quantity: nextQty, status: nextQty <= p.reorderLevel ? "Critical" : "Healthy" as any };
      }
      if (p.id === "PRD-003") {
        const nextQty = Math.max(0, p.quantity - 1);
        return { ...p, quantity: nextQty, status: nextQty <= p.reorderLevel ? "Critical" : "Healthy" as any };
      }
      return p;
    }));

    // Update registers
    setTransactions([activeTrx, ...transactions]);

    // Send CRM loyalty points
    setCustomers(customers.map(c => {
      if (c.name.toLowerCase() === customerNameStr.toLowerCase()) {
        return {
          ...c,
          totalSpend: c.totalSpend + 412.00,
          loyaltyPoints: c.loyaltyPoints + 41
        };
      }
      return c;
    }));

    return activeTrx;
  };

  // 4. PRICE EXPIRY MARKDOWN (Slagging 40% Prices)
  const handleApplyMarkdown = (prdId: string, discountPct: number) => {
    setProducts(products.map(p => {
      if (p.id === prdId) {
        return {
          ...p,
          sellingPrice: Number((p.sellingPrice * (1 - discountPct / 100)).toFixed(2)),
          status: "Healthy" // mark healthy since clearance is moving it
        };
      }
      return p;
    }));
  };

  // 5. PURGING SPOILED INVENTORY BATCHES
  const handleDiscardProduct = (prdId: string) => {
    setProducts(products.filter(p => p.id !== prdId));
  };

  // 6. PROCUREMENT CONTRACT APPROVAL
  const handleApprovePO = (poId: string) => {
    setPurchaseOrders(purchaseOrders.map(po => {
      if (po.id === poId) {
        return { ...po, status: "APPROVED", deliveryStatus: "In-Transit" };
      }
      return po;
    }));

    // Increment vendor balances
    const targetPo = purchaseOrders.find(po => po.id === poId);
    if (targetPo) {
      setSuppliers(suppliers.map(s => {
        if (s.id === targetPo.supplierId) {
          return { ...s, outstandingBalance: s.outstandingBalance + targetPo.totalAmount };
        }
        return s;
      }));
    }
  };

  // 7. SWAPPING IN-APP USER ROLES
  const handleSwitchSessionRole = (role: UserRole) => {
    const matchingStaff = users.find(u => u.role === role);
    if (matchingStaff) {
      setCurrentUser(matchingStaff);
    } else {
      // default template
      setCurrentUser({
        id: "U-TEMP-" + Math.floor(100+Math.random()*900),
        name: `Staff Member (${role})`,
        email: `staff@shopnest.com`,
        role
      });
    }
    setActiveTab("dashboard");
  };

  // 8. MARKING NOTIFICATIONS AS READ
  const handleReadNotification = (nid: string) => {
    setNotifications(notifications.map(n => n.id === nid ? { ...n, unread: false } : n));
  };

  // 9. SIGN UP ACTION
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) return;

    const newUser: User = {
      id: "U-00" + (users.length + 1),
      name: signupName,
      email: signupEmail,
      role: signupRole,
      storeId: signupStore,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);

    // Create corresponding employee profile
    const newEmployee: Employee = {
      id: "EMP-00" + (employees.length + 1),
      name: signupName,
      phone: "+1 (555) " + Math.floor(100 + Math.random()*900) + "-0199",
      email: signupEmail,
      role: signupRole,
      salary: signupRole === UserRole.SUPER_ADMIN ? 14500 : signupRole === UserRole.COMPANY_MANAGER ? 9500 : 5200,
      storeId: signupStore,
      storeName: sampleStores.find(s => s.id === signupStore)?.name || "Corporate Admin Unit",
      joinedDate: "Today",
      status: "Active",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    };
    setEmployees([newEmployee, ...employees]);

    setIsAuthenticated(true);
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
  };

  // 10. LOGIN WITH A PRE-RATED USER DIRECTLY
  const handleDirectAuthLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab("dashboard");
  };

  // Nav items based on role clearances
  const navItems = [
    { id: "dashboard", label: "Executive Hub", icon: "dashboard", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.STORE_MANAGER] },
    { id: "inventory", label: "Master Catalog", icon: "inventory_2", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.STORE_MANAGER] },
    { id: "expiry", label: "Decaying Batches", icon: "hourglass_empty", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.STORE_MANAGER] },
    { id: "pos", label: "Registers (POS)", icon: "shopping_cart", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.STORE_MANAGER, UserRole.CASHIER] },
    { id: "purchases", label: "Procurements (PO)", icon: "order_approve", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.STORE_MANAGER] },
    { id: "sales", label: "Audit Ledger", icon: "receipt_long", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER] },
    { id: "employees", label: "Staff Roster", icon: "badge", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER] },
    { id: "customers", label: "CRM CRM Points", icon: "group", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.STORE_MANAGER] },
    { id: "suppliers", label: "Vendor Contracts", icon: "handshake", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER] },
    { id: "stores", label: "Branch Physicals", icon: "storefront", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER] },
    { id: "notifications", label: "System Alarms", icon: "notifications", roles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.STORE_MANAGER, UserRole.CASHIER], badge: notifications.filter(n => n.unread).length }
  ];

  const visibleNavs = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827] flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white pb-12">
      {/* Primary Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center p-2">
            <span className="material-symbols-outlined text-white font-bold text-2xl">store</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 font-sans tracking-tight">ShopNest POS Elite</h1>
            <p className="text-[10px] text-gray-400 font-medium font-sans">Enterprise Retail & Superstore Management &bull; v1.0.0 Stable</p>
          </div>
        </div>

        {/* Auth controllers or role selector */}
        {isAuthenticated ? (
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Quick staff session toggler */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 pl-3 pr-1.5 py-1 rounded-xl">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider font-sans">Privilege:</span>
              <select
                value={currentUser.role}
                onChange={(e) => handleSwitchSessionRole(e.target.value as UserRole)}
                className="bg-white border border-gray-200 text-xs font-sans text-blue-600 font-bold p-1 rounded-lg focus:outline-none"
              >
                <option value={UserRole.SUPER_ADMIN}>👑 Super Admin</option>
                <option value={UserRole.COMPANY_MANAGER}>🏢 Company Manager</option>
                <option value={UserRole.STORE_MANAGER}>🏪 Store Manager</option>
                <option value={UserRole.CASHIER}>💵 Cashier Register</option>
              </select>
            </div>

            {/* Profile Avatar & Sign Out */}
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
              <div className="hidden md:block text-left text-xs">
                <span className="font-bold text-gray-800 block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-[#A2A4A7] block font-sans">{currentUser.email}</span>
              </div>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="bg-gray-50 hover:bg-rose-50 text-rose-600 border border-gray-200 hover:border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                Exit Gate
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {/* Main Container Core */}
      {!isAuthenticated ? (
        /* =========================================================================
            SIGNUP & LOGIN PORTAL GATEWAY
           ========================================================================= */
        <div className="flex-1 flex items-center justify-center mt-12 px-4 max-w-4xl mx-auto w-full">
          <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-none grid grid-cols-1 md:grid-cols-2 max-w-3xl w-full">
            {/* Branding side */}
            <div className="bg-[#111827] text-white p-10 flex flex-col justify-between relative overflow-hidden font-sans">
              <div className="absolute right-0 top-0 w-64 h-64 bg-slate-800/30 rounded-full translate-x-12 -translate-y-12"></div>
              <div className="relative z-10">
                <span className="bg-slate-800 text-slate-300 px-3 py-1 text-[9px] uppercase tracking-wider font-extrabold rounded-full font-mono border border-slate-700">
                  Authentication gateway
                </span>
                <h2 className="text-3xl font-extrabold text-white font-sans mt-4 leading-tight tracking-tight">
                  ShopNest Enterprise POS
                </h2>
                <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
                  Enterprise-ready, real-time multi-store management. Complete synchronization, ledger audits, and purchase authorizations.
                </p>
              </div>

              {/* Developer Bypass options */}
              <div className="relative z-10 pt-8 border-t border-slate-800">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Fast Developer Profile Logins:</h4>
                <div className="space-y-1.5 mt-2">
                  {users.map((usr, i) => (
                    <div
                      key={i}
                      onClick={() => handleDirectAuthLogin(usr)}
                      className="bg-slate-900/60 hover:bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer flex justify-between items-center transition"
                    >
                      <div className="flex items-center gap-2">
                        <img src={usr.avatarUrl} alt={usr.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-[10px] font-bold">{usr.name}</span>
                      </div>
                      <span className="text-[8px] bg-blue-600 px-2 py-0.5 rounded font-bold font-sans uppercase text-white">{usr.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Forms side */}
            <div className="p-10 flex flex-col justify-center font-sans">
              {authView === "login" ? (
                /* Login screen */
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Default mock login matches Super Admin
                  setIsAuthenticated(true);
                  setActiveTab("dashboard");
                }} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Sign in to Enterprise Control</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Enter password keys or use fast developer bypass left.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Staff corporate Email</label>
                      <input
                        type="email"
                        required
                        defaultValue="m.sterling@shopnest.com"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-sans text-gray-700 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Corporate Pass-Key</label>
                      <input
                        type="password"
                        required
                        defaultValue="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-none transition-all cursor-pointer"
                  >
                    Authorize Session
                  </button>

                  <div className="text-center">
                    <span className="text-[10px] text-gray-400">Don't have a staff registration key?</span>
                    <button
                      type="button"
                      onClick={() => setAuthView("signup")}
                      className="text-[10.5px] text-blue-600 hover:underline font-bold ml-1.5 cursor-pointer"
                    >
                      Create custom account
                    </button>
                  </div>
                </form>
              ) : (
                /* Sign up screen */
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Establish corporate profile</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Register staff credentials, locking parameters dynamically.</p>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">FullName</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rachel Carson"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Corporate Email</label>
                      <input
                        type="email"
                        required
                        placeholder="r.carson@shopnest.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Passphrase</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Designation Role</label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value as UserRole)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-600"
                      >
                        <option value={UserRole.CASHIER}>💵 Cashier Register</option>
                        <option value={UserRole.STORE_MANAGER}>🏪 Store Manager</option>
                        <option value={UserRole.COMPANY_MANAGER}>🏢 Company Manager</option>
                        <option value={UserRole.SUPER_ADMIN}>👑 Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Assign Physical branch</label>
                      <select
                        value={signupStore}
                        onChange={(e) => setSignupStore(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-600"
                      >
                        {sampleStores.map((st) => (
                           <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-none transition-all cursor-pointer"
                  >
                    Commit credentials
                  </button>

                  <div className="text-center">
                    <span className="text-[10px] text-gray-400">Already possess staff account?</span>
                    <button
                      type="button"
                      onClick={() => setAuthView("login")}
                      className="text-[10.5px] text-blue-600 hover:underline font-bold ml-1.5 cursor-pointer"
                    >
                      Bypass sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            AUTHENTICATED CONSOLE PANEL
           ========================================================================= */
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-4 shadow-none space-y-4">
            <div className="pb-3 border-b border-gray-200 px-2 font-sans">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Enterprise Sections</span>
              <span className="text-xs font-semibold text-gray-900 block mt-0.5">{currentUser.role === UserRole.SUPER_ADMIN ? "Enterprise Admin Console" : "Fulfillment Station"}</span>
            </div>

            <nav className="space-y-1">
              {visibleNavs.map((nav, i) => {
                const isActive = activeTab === nav.id;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTab(nav.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold font-sans transition-all capitalize cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-none"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">{
                        nav.icon === "order_approve" ? "rule" :
                        nav.icon === "dashboard" ? "analytics" : nav.icon
                      }</span>
                      <span>{nav.label}</span>
                    </div>

                    {nav.badge !== undefined && nav.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono leading-none ${
                        isActive ? "bg-white text-blue-600 font-extrabold" : "bg-blue-600 text-white font-bold"
                      }`}>
                        {nav.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[10px] text-gray-400 font-medium font-sans text-center mt-6">
              ShopNest POS Enterprise Cloud Services &bull; SLA 99.98%
            </div>
          </aside>

          {/* Core dynamic content viewer */}
          <main className="lg:col-span-9 space-y-8">
            <div className="transition-all duration-300">
              
              {/* Screen Router */}
              {activeTab === "dashboard" && (
                <DashboardModule
                  currentUser={currentUser}
                  stores={sampleStores}
                  products={products}
                  transactions={transactions}
                  notifications={notifications}
                  onNavigateToScreen={(screen) => setActiveTab(screen)}
                />
              )}

              {activeTab === "inventory" && (
                <InventoryModule
                  products={products}
                  categories={sampleCategories}
                  suppliers={suppliers}
                  onAddProduct={handleAddProduct}
                  onUpdateQty={handleUpdateProductQty}
                />
              )}

              {activeTab === "expiry" && (
                <ExpiryModule
                  products={products}
                  onApplyMarkdown={handleApplyMarkdown}
                  onDiscardProduct={handleDiscardProduct}
                />
              )}

              {activeTab === "pos" && (
                <POSModule
                  currentUser={currentUser}
                  products={products}
                  onCheckout={handlePOSCheckout}
                />
              )}

              {/* Combined Admin, Procurement, CRM, Employees, and Notifications tabs */}
              {["purchases", "sales", "employees", "customers", "suppliers", "stores", "notifications"].includes(activeTab) && (
                <EnterpriseAdminModules
                  activeSection={activeTab}
                  stores={sampleStores}
                  employees={employees}
                  transactions={transactions}
                  customers={customers}
                  suppliers={suppliers}
                  purchaseOrders={purchaseOrders}
                  notifications={notifications}
                  onApprovePO={handleApprovePO}
                  onNavigateToScreen={(scr) => setActiveTab(scr)}
                  onReadNotification={handleReadNotification}
                />
              )}
            </div>

            {/* Complete Relational DDL & Django REST Endpoints center embedded natively */}
            <ArchitectureViewer />
          </main>
        </div>
      )}
    </div>
  );
}
