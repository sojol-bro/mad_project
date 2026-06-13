import React from "react";
import { User, UserRole, Store, Product, SalesTransaction, SystemNotification } from "../types";

interface DashboardProps {
  currentUser: User;
  stores: Store[];
  products: Product[];
  transactions: SalesTransaction[];
  notifications: SystemNotification[];
  onNavigateToScreen: (screen: string) => void;
}

export default function DashboardModule({
  currentUser,
  stores,
  products,
  transactions,
  notifications,
  onNavigateToScreen
}: DashboardProps) {
  // Aggregate calculations
  const totalRevenue = transactions
    .filter(t => t.status === "Completed")
    .reduce((acc, t) => acc + t.amount, 0) + 4289540.00; // base + user actions

  const lowStockCount = products.filter(p => p.quantity <= p.reorderLevel).length;
  const expiringCount = products.filter(p => p.status === "Expiring").length;
  const activeStores = stores.filter(s => s.status === "Online").length;

  const topProducts = [
    { name: "Artisan Roast: Ethiopia Yirgacheffe", rev: 124500, sales: 2964, category: "Gourmet Coffee" },
    { name: "AeroFlow Runner X1", rev: 84320, sales: 648, category: "Athletic Wear" },
    { name: "Horizon Smartwatch Elite", rev: 189020, sales: 759, category: "Electronics" },
    { name: "Studio Pro Wireless ANC", rev: 156000, sales: 447, category: "Audio Gear" }
  ].sort((a,b) => b.rev - a.rev);

  return (
    <div className="space-y-6 font-sans">
      {/* Dynamic Role Indicator Banner */}
      <div className="bg-[#111827] text-white p-6 rounded-lg border border-gray-800 shadow-none relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-800/10 rounded-full translate-x-12 -translate-y-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-full font-mono border border-slate-700 text-slate-300">
                Active Session: {currentUser.role}
              </span>
              <span className="text-slate-400 font-mono text-xs">ID: {currentUser.id}</span>
            </div>
            <h1 className="text-2xl font-bold font-sans tracking-tight mt-2 text-white">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
              {currentUser.role === UserRole.SUPER_ADMIN && "Super Administrator view. Full permissions across all enterprise stores, categories, and financials enabled."}
              {currentUser.role === UserRole.COMPANY_MANAGER && "Company Manager view. Multi-store oversight, staff designations, and supply chain authorizations active."}
              {currentUser.role === UserRole.STORE_MANAGER && "Store Manager view. Branch replenishment orders, local inventories, and clock scheduling logs enabled."}
              {currentUser.role === UserRole.CASHIER && "POS Cashier console active. Fluid checkout transactions, receipt generation, and barcode lookup services running."}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onNavigateToScreen("settings")}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Control Center
            </button>
            <button 
              onClick={() => onNavigateToScreen("pos")}
              className="bg-white hover:bg-gray-100 text-gray-905 text-xs font-bold px-4 py-2 rounded-lg transition-all border border-gray-200 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-blue-600">shopping_cart</span>
              Launch POS
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-none flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 font-sans uppercase tracking-wider">Enterprise Revenue</span>
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-lg text-lg font-bold">payments</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900 font-sans tracking-tight">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-600 font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+18.4% YoY Growth</span>
            </div>
          </div>
        </div>

        {/* Card 2: Low Stock */}
        <div 
          onClick={() => onNavigateToScreen("inventory")}
          className="bg-white p-5 rounded-lg border border-gray-200 shadow-none flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 font-sans uppercase tracking-wider">Low Stock Warnings</span>
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-2 rounded-lg text-lg">warning</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900 font-sans tracking-tight flex items-baseline gap-1.5">
              {lowStockCount} <span className="text-xs text-gray-400 font-normal">items critical</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-600 font-semibold group-hover:underline">
              <span>Replenish via Procurement</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div 
          onClick={() => onNavigateToScreen("expiry")}
          className="bg-white p-5 rounded-lg border border-gray-200 shadow-none flex flex-col justify-between hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 font-sans uppercase tracking-wider">Batch Expiries</span>
            <span className="material-symbols-outlined text-rose-600 bg-rose-50 p-2 rounded-lg text-lg">hourglass_empty</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900 font-sans tracking-tight flex items-baseline gap-1.5">
              {expiringCount} <span className="text-xs text-gray-400 font-normal">active alerts</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-600 font-semibold group-hover:underline">
              <span>Execute Clearance Markdowns</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Stores */}
        <div 
          onClick={() => onNavigateToScreen("stores")}
          className="bg-white p-5 rounded-lg border border-gray-200 shadow-none flex flex-col justify-between hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 font-sans uppercase tracking-wider">Physical Stores</span>
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-lg text-lg">storefront</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900 font-sans tracking-tight flex items-baseline gap-1.5">
              {activeStores} <span className="text-xs text-gray-400 font-normal">/ {stores.length} Online</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>All nodes synced successfully</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Map Map Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Svg Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-none">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Enterprise Revenue Trends</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Aggregated monthly sales performance & forecast projections [USD]</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                <span className="text-[10px] font-semibold text-gray-500">Sales Ledger</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#93c5fd]"></span>
                <span className="text-[10px] font-semibold text-gray-500">Margin Recovery</span>
              </div>
            </div>
          </div>

          {/* Pure Premium Custom SVG Interactive Area Chart for flawless responsive layout support */}
          <div className="w-full h-64 bg-gray-50 rounded-lg p-4 flex flex-col justify-between relative group/chart">
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              <div className="border-t border-gray-200/50 w-full h-0"></div>
              <div className="border-t border-gray-200/50 w-full h-0"></div>
              <div className="border-t border-gray-200/50 w-full h-0"></div>
              <div className="border-t border-gray-200/40 w-full h-0"></div>
            </div>
            
            {/* SVG Content */}
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible z-10">
              {/* Grid Horizontal Guide Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f3f5" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f3f5" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f3f5" strokeWidth="1" />
              
              {/* Fill Area Gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area path for Revenue sales trend */}
              <path
                d="M 10,180 Q 80,140 140,110 T 260,85 T 380,45 T 490,20 L 490,200 L 10,200 Z"
                fill="url(#chartGradient)"
              />
              
              {/* Trend Stroke */}
              <path
                d="M 10,180 Q 80,140 140,110 T 260,85 T 380,45 T 490,20"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Path 2: Margins trend */}
              <path
                d="M 10,190 Q 80,170 140,150 T 260,130 T 380,110 T 490,75 L 490,200 L 10,200 Z"
                fill="url(#marginGradient)"
              />
              <path
                d="M 10,190 Q 80,170 140,150 T 260,130 T 380,110 T 490,75"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeDasharray="4 3"
              />

              {/* SVG Markers & Tooltips */}
              <circle cx="380" cy="45" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="490" cy="20" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="260" cy="85" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Labels */}
            <div className="flex justify-between text-[9px] text-gray-400 font-mono font-bold mt-2 border-t border-gray-100 pt-2 px-1">
              <span>JAN (240k)</span>
              <span>MAR (290k)</span>
              <span>MAY (310k)</span>
              <span>JUL (340k)</span>
              <span>SEP (390k)</span>
              <span>NOV (420k)</span>
              <span>DEC (490k)</span>
            </div>
          </div>
        </div>

        {/* Store Performance Map Sidebar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Regional Growth Metrics</h3>
              <span className="material-symbols-outlined text-gray-400 text-sm">more_horiz</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Physical networks expansion index</p>
          </div>

          <div className="my-4 space-y-3">
            {stores.map((st, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-all">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded px-1 flex items-center justify-center font-bold text-xs ${
                    i===0 ? "bg-blue-100 text-blue-800" :
                    i===1 ? "bg-amber-100 text-amber-800" :
                    i===2 ? "bg-blue-55 text-blue-800 border" : "bg-gray-100 text-gray-850"
                  }`}>{st.code.split("-")[1]}</span>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 font-sans">{st.name}</h4>
                    <span className="text-[9px] text-gray-400 font-mono">Capacity: {st.inventoryCount} items ({st.inventoryCapacityPct}%)</span>
                  </div>
                </div>
                <div className="text-right font-sans">
                  <div className="text-xs font-mono font-bold text-gray-850">${st.dailySales.toLocaleString()}</div>
                  <span className={`text-[9px] font-bold font-mono ${st.salesGrowth >= 0 ? "text-blue-600" : "text-rose-500"}`}>
                    {st.salesGrowth >= 0 ? "+" : ""}{st.salesGrowth}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onNavigateToScreen("stores")}
            className="w-full text-center py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">hub</span>
            Analyze All Branches
          </button>
        </div>
      </div>

      {/* Grid: Fast Actions & Stock Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Recent Activity Ticker */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-none overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Recent Financial Sales Ledger</h3>
              <span className="text-[10px] bg-gray-105 text-gray-500 font-sans px-2.5 py-1 rounded-full font-semibold">Live Feed</span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {transactions.slice(0, 4).map((trx, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center transition-all hover:bg-gray-50 rounded-lg px-2">
                  <div className="flex items-center gap-3 font-sans">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center">
                      {trx.customerInitials}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 font-sans">{trx.customerName}</h4>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">{trx.dateTime} &bull; Paid via {trx.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-gray-800">${trx.amount.toFixed(2)}</span>
                    <div className="mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        trx.status === "Completed" ? "bg-blue-50 text-blue-700 border border-blue-250" :
                        trx.status === "Refunded" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>{trx.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onNavigateToScreen("sales")}
            className="w-full text-center py-2.5 bg-gray-105 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-all mt-4 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            View Ledger Audit Trails
          </button>
        </div>

        {/* Product Scorecard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Top Performing Products</h3>
              <span className="material-symbols-outlined text-gray-400 text-sm">insights</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Ranked by overall enterprise margin share</p>
          </div>

          <div className="my-4 space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="text-xs font-bold font-sans text-gray-400 w-4">#{i+1}</span>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 font-sans truncate max-w-[130px]">{p.name}</h4>
                    <span className="text-[9px] text-gray-400">{p.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-gray-800">${p.rev.toLocaleString()}</div>
                  <span className="text-[9px] text-blue-600 font-semibold">{p.sales} units shipped</span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onNavigateToScreen("inventory")}
            className="w-full text-center py-2.5 bg-gray-105 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            Inspect Inventory Master
          </button>
        </div>
      </div>
    </div>
  );
}
