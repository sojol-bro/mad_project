import React, { useState } from "react";
import { Store, Employee, SalesTransaction, Customer, Supplier, PurchaseOrder, SystemNotification } from "../types";

interface EnterpriseAdminProps {
  activeSection: string;
  stores: Store[];
  employees: Employee[];
  transactions: SalesTransaction[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  notifications: SystemNotification[];
  onApprovePO: (poId: string) => void;
  onNavigateToScreen: (screen: string) => void;
  onReadNotification: (nid: string) => void;
}

export default function EnterpriseAdminModules({
  activeSection,
  stores,
  employees,
  transactions,
  customers,
  suppliers,
  purchaseOrders,
  notifications,
  onApprovePO,
  onNavigateToScreen,
  onReadNotification
}: EnterpriseAdminProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [poFilter, setPoFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "RECEIVED">("ALL");

  const filteredOrders = purchaseOrders.filter(po => {
    const sSearch = po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || po.id.toLowerCase().includes(searchTerm.toLowerCase());
    const sStatus = poFilter === "ALL" || po.status === poFilter;
    return sSearch && sStatus;
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      {/* =========================================================================
          1. PROCUREMENT SYSTEM (PURCHASE ORDERS)
         ========================================================================= */}
      {activeSection === "purchases" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Replenishment Registry (Procurement)</h3>
              <p className="text-[10px] text-gray-400">Order inventory, authorize budgets, and view freight pipelines.</p>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto" id="po-filters">
              {["ALL", "PENDING", "APPROVED", "RECEIVED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPoFilter(st as any)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-semibold font-sans transition-all cursor-pointer ${
                    poFilter === st ? "bg-blue-600 text-white shadow-none" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Table of Orders */}
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
              <div className="bg-gray-150 p-3 font-semibold text-xs text-gray-700">Enterprise Order History</div>
              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredOrders.map((po, i) => (
                  <div key={i} className="p-3 hover:bg-gray-50 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">{po.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          po.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          po.status === "APPROVED" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>{po.status}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{po.supplierName} &bull; {po.itemCount} Units</p>
                      <span className="text-[9px] text-gray-400 block font-mono">Issued {po.createdAt} &bull; By {po.createdByName}</span>
                    </div>

                    <div className="text-right space-y-1.5">
                      <span className="font-mono font-bold text-gray-800 block">${po.totalAmount.toLocaleString()}</span>
                      {po.status === "PENDING" && (
                        <button
                          onClick={() => {
                            onApprovePO(po.id);
                            alert(`Purchase Order ${po.id} successfully authorized! Balance logged to supplier ledger.`);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-2 py-1 rounded shadow-none cursor-pointer"
                        >
                          Approve budget
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Live pipeline Shipment maps */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200/60 space-y-4">
              <h4 className="text-xs font-bold text-gray-900 font-sans flex items-center gap-1">
                <span className="material-symbols-outlined text-blue-600 text-sm">local_shipping</span>
                Active Freight Tracking Pipelines
              </h4>
              <p className="text-[10px] text-gray-400">Verifying live logistics and delivery schedules with third party carriers.</p>

              {/* Step indicator */}
              <div className="space-y-4 pt-2">
                {[
                  { step: "PO PO-88285 (Sonic LLC)", carrier: "FedEx Freight #8839", est: "Delayed (Overcast)", active: 2, steps: ["Origin Depot", "Custom Clearance", "In-Transit", "Flagship Hub"] },
                  { step: "PO PO-88210 (Vanguard)", carrier: "UPS Ground #994A", est: "Completed (Invoiced)", active: 3, steps: ["Origin Depot", "In-Transit", "Custom Clearance", "Arrived"] }
                ].map((track, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-none space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-sans">
                      <span className="font-bold text-gray-700">{track.step}</span>
                      <span className="text-gray-400 font-mono font-bold">{track.carrier}</span>
                    </div>
                    
                    {/* Pipeline Dots */}
                    <div className="relative flex justify-between items-center pt-1.5">
                      {/* Connection bar */}
                      <div className="absolute left-0 right-0 top-[11px] h-0.5 bg-gray-100 z-0"></div>
                      
                      {track.steps.map((label, stepIdx) => (
                        <div key={stepIdx} className="flex flex-col items-center z-10 font-sans">
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[8px] font-mono font-bold ${
                            stepIdx <= track.active ? "bg-blue-600 border-blue-750 text-white" : "bg-white border-gray-200 text-gray-400"
                          }`}>
                            {stepIdx + 1}
                          </span>
                          <span className="text-[8px] text-gray-400 mt-1 font-sans">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. FINANCIAL SALES LEDGER
         ========================================================================= */}
      {activeSection === "sales" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Corporate Audit Ledger</h3>
            <p className="text-[10px] text-gray-400">Historical register tracking all branches sales and payment operations.</p>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 font-sans uppercase">
                  <th className="px-4 py-3">Receipt Index</th>
                  <th className="px-4 py-3">Client CRM Account</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Audit Amount</th>
                  <th className="px-4 py-3 text-center">Receipt verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-sans text-gray-600">
                {transactions.map((trx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900">{trx.id}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-800">{trx.customerName}</td>
                    <td className="px-4 py-3.5 text-gray-400">{trx.dateTime}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-gray-100 font-semibold px-2 py-0.5 rounded text-[10px]">{trx.paymentMethod} Instrument</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-gray-900">${trx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          alert(`Verifying cryptographic token signature for Receipt ${trx.id}:\n- Status: SECURE\n- Hash ID: sha256_0x994a28...`);
                        }}
                        className="bg-gray-50 hover:bg-gray-200 border border-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1.5 rounded transition"
                      >
                        Verify hash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. CRM CUSTOMER DIRECTORY
         ========================================================================= */}
      {activeSection === "customers" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">CRM Loyalty Ledger</h3>
            <p className="text-[10px] text-gray-400">View customer lifetime values, metrics, and manage customized promotional points.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customers.map((c, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-150 hover:border-blue-200 transition-all text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 font-sans block">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    c.segment === "VIP Member" ? "bg-purple-100 text-purple-800" :
                    c.segment === "At Risk" ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-blue-100 text-blue-800"
                  }`}>{c.segment}</span>
                </div>

                <div className="space-y-1 text-[11px] text-gray-500 font-mono">
                  <div>Phone: {c.phone}</div>
                  <div>Email: {c.email}</div>
                  <div className="flex justify-between font-sans border-t border-gray-200/50 pt-2 text-xs font-semibold text-gray-700">
                    <span>Spend: ${c.totalSpend.toLocaleString()}</span>
                    <span className="text-blue-600">Points: {c.loyaltyPoints} pts</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert(`${c.name} balance added by 100 points! Promo dispatch successful.`);
                  }}
                  className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold font-sans text-[10px] rounded-md shadow-none cursor-pointer"
                >
                  Issue Promo 100pts
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. CORPORATE STORE NETWORK
         ========================================================================= */}
      {activeSection === "stores" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Physical Node Network Directory</h3>
            <p className="text-[10px] text-gray-400">Manage structural store locations, branches performance, and physical properties.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((st, i) => (
              <div key={i} className="p-5 bg-gray-50 rounded-lg border border-gray-200/60 hover:border-blue-200 transition-all text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200/50">
                    <span className="font-bold text-gray-900 text-sm font-sans">{st.name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase font-mono ${
                      st.status === "Online" ? "bg-blue-105 text-blue-700 border border-blue-250" : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                    }`}>{st.status}</span>
                  </div>

                  <div className="space-y-1.5 py-4 text-gray-500 font-sans font-medium text-[11px]">
                    <div>Code: <span className="font-mono text-gray-800 font-bold">{st.code}</span></div>
                    <div>Address: <span className="text-gray-800">{st.address}</span></div>
                    <div>Phone: <span className="text-gray-800">{st.phone}</span></div>
                    <div>Branch Manager: <span className="text-blue-600 font-semibold">{st.managerName}</span></div>
                  </div>
                </div>

                <div className="flex bg-white px-3 py-2.5 rounded-lg border border-gray-100 justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-[#A2A4A7] block uppercase font-bold">Today Sales</span>
                    <span className="font-mono font-bold text-gray-850 block mt-0.5">${st.dailySales.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#A2A4A7] block uppercase font-bold">MoM Growth</span>
                    <span className={`font-mono font-bold block mt-0.5 ${st.salesGrowth >= 0 ? "text-blue-600" : "text-rose-500"}`}>
                      {st.salesGrowth >= 0 ? "+" : ""}{st.salesGrowth}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#A2A4A7] block uppercase font-bold">Capacity</span>
                    <span className="font-mono font-bold text-gray-850 block mt-0.5">{st.inventoryCapacityPct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          5. EMPLOYEE ROSTER (PAYROLL / SCHEDULING)
         ========================================================================= */}
      {activeSection === "employees" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Staff Human Resources Directory</h3>
            <p className="text-[10px] text-gray-400">View active designations, monthly salaries, shift schedules, and branch assignments.</p>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 font-sans uppercase">
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Corporate Role</th>
                  <th className="px-4 py-3">Branch Location</th>
                  <th className="px-4 py-3">Salary ($)</th>
                  <th className="px-4 py-3">Employment Date</th>
                  <th className="px-4 py-3 text-center">Staff status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-sans text-gray-600">
                {employees.map((emp, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3.5 flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-gray-100 object-cover"
                      />
                      <span className="font-bold text-gray-900 font-sans">{emp.name}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{emp.role}</td>
                    <td className="px-4 py-3.5 text-blue-800 font-semibold">{emp.storeName}</td>
                    <td className="px-4 py-3.5 font-mono font-bold">${emp.salary.toLocaleString()}/mo</td>
                    <td className="px-4 py-3.5 text-[#ACAEB2]">{emp.joinedDate}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                        emp.status === "Active" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>{emp.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. VENDOR DIRECTORY (SUPPLIERS)
         ========================================================================= */}
      {activeSection === "suppliers" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Pre-selected Vendor Ledger</h3>
            <p className="text-[10px] text-gray-400">Manage supplier balances, logistical licenses, and fulfillment rating scores.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((s, i) => (
              <div key={i} className="p-5 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-all text-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200/50">
                  <span className="font-bold text-gray-900 text-sm font-sans">{s.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    s.status === "Preferred" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    s.status === "Overdue" ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-gray-100 text-gray-700"
                  }`}>{s.status} Vendor</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-gray-400 font-mono">
                  <div>License: <span className="text-gray-700 font-bold">{s.licenseNumber}</span></div>
                  <div>Contact: <span className="text-gray-700">{s.phone} &bull; {s.email}</span></div>
                  <div>Warehouse: <span className="text-gray-700">{s.address}</span></div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200/50 font-sans font-semibold">
                  <span>Balance Due: <span className="font-mono text-rose-600 font-black">${s.outstandingBalance.toLocaleString()}</span></span>
                  <span className="text-blue-600 font-bold">Fulfillment: {s.fulfillmentRatePct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          7. ACTIONABLE SYSTEM NOTIFICATIONS
         ========================================================================= */}
      {activeSection === "notifications" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Actionable System Alarms</h3>
            <p className="text-[10px] text-gray-400">Urget warning alerts. Clicking action redirects and resolves state problems.</p>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden shadow-none">
            {notifications.map((n, i) => (
              <div
                key={i}
                onClick={() => onReadNotification(n.id)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                  n.unread ? "bg-blue-50/20 font-medium border-l-4 border-blue-600" : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`material-symbols-outlined text-xl p-2 rounded-xl ${
                    n.urgency === "critical" ? "bg-rose-50 text-rose-700" :
                    n.urgency === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                  }`}>
                    {n.type === "low_stock" ? "warning" :
                     n.type === "expiry" ? "hourglass_empty" :
                     n.type === "purchase_order" ? "receipt_long" : "info"}
                  </span>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900 font-sans">{n.title}</h4>
                    <p className="text-[11px] text-[#A2A4A7] mt-0.5">{n.message}</p>
                    <span className="text-[9px] text-[#ACAEB2] block mt-1 font-mono">{n.timestamp}</span>
                  </div>
                </div>

                {n.actionRequired && n.actionText && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Redirect trigger matching guidelines
                      if (n.type === "low_stock" || n.type === "purchase_order") {
                        onNavigateToScreen("purchases");
                        alert(`Sliding route view, resolving: ${n.actionText}`);
                      } else {
                        onNavigateToScreen("expiry");
                        alert(`Slowing markdown Markdown window, resolving: ${n.actionText}`);
                      }
                      onReadNotification(n.id);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-lg transition shadow-none cursor-pointer"
                  >
                    {n.actionText}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
