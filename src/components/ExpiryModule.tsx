import React, { useState } from "react";
import { Product } from "../types";

interface ExpiryProps {
  products: Product[];
  onApplyMarkdown: (prdId: string, discountPct: number) => void;
  onDiscardProduct: (prdId: string) => void;
}

export default function ExpiryModule({ products, onApplyMarkdown, onDiscardProduct }: ExpiryProps) {
  const [expiryFilter, setExpiryFilter] = useState<"all" | "7" | "30" | "60">("30");

  const expiringProducts = products.filter(prd => {
    if (!prd.expiryDate) return false;
    
    // Parse dates to compute delta days
    const expDate = new Date(prd.expiryDate);
    const today = new Date();
    const diffMs = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (expiryFilter === "7") return diffDays > 0 && diffDays <= 7;
    if (expiryFilter === "30") return diffDays > 0 && diffDays <= 30;
    if (expiryFilter === "60") return diffDays > 0 && diffDays <= 60;
    return diffDays > 0 && diffDays <= 120; // general list
  });

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-none space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Active Expiry Ledger</h3>
          <p className="text-[10px] text-gray-400">Scan expiration timetables, setting clearance margins before batches spoil.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto" id="expiry-filters">
          <button
            onClick={() => setExpiryFilter("7")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold font-sans transition-all cursor-pointer ${
              expiryFilter === "7" ? "bg-rose-600 text-white shadow-none" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🔥 Under 7 Days
          </button>
          <button
            onClick={() => setExpiryFilter("30")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold font-sans transition-all cursor-pointer ${
              expiryFilter === "30" ? "bg-amber-600 text-white shadow-none" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            ⚠️ Under 30 Days
          </button>
          <button
            onClick={() => setExpiryFilter("60")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold font-sans transition-all cursor-pointer ${
              expiryFilter === "60" ? "bg-blue-600 text-white shadow-none" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            📋 Under 60 Days
          </button>
          <button
            onClick={() => setExpiryFilter("all")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold font-sans transition-all cursor-pointer ${
              expiryFilter === "all" ? "bg-blue-600 text-white shadow-none" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 font-sans uppercase">
              <th className="px-4 py-3">Product Info</th>
              <th className="px-4 py-3">SKU Batch</th>
              <th className="px-4 py-3 text-rose-605">Expiration Date</th>
              <th className="px-4 py-3">In-Stock Qty</th>
              <th className="px-4 py-3">Active Unit Cost</th>
              <th className="px-4 py-4 text-center">Fulfill Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-sans text-gray-600">
            {expiringProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl text-gray-300 block mb-1">sentiment_satisfied</span>
                  No decaying batches detected inside the selected timeframe. Good job!
                </td>
              </tr>
            ) : (
              expiringProducts.map((prd, i) => {
                const daysRemaining = (() => {
                   const expDate = new Date(prd.expiryDate!);
                   const today = new Date();
                   const diffMs = expDate.getTime() - today.getTime();
                   return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                })();

                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-4 py-3.5 flex items-center gap-3">
                      <img
                        src={prd.imageUrl}
                        alt={prd.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <div>
                        <span className="font-bold text-gray-950 block">{prd.name}</span>
                        <span className="text-[10px] text-gray-400 block">{prd.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-750 font-bold block w-fit">{prd.sku}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5 font-mono">{prd.batchNumber || "B-UNK-99"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold font-mono text-rose-600 block">{prd.expiryDate}</span>
                      <span className={`text-[10px] font-semibold ${daysRemaining <= 7 ? "text-rose-500 font-extrabold animate-pulse" : "text-amber-500"}`}>
                        ({daysRemaining} Days left)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-800">{prd.quantity} units</td>
                    <td className="px-4 py-3.5 font-mono font-bold font-semibold text-blue-600">${prd.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            onApplyMarkdown(prd.id, 40);
                            alert(`Markdown applied successfully! Price reduced by 40%: $${(prd.sellingPrice * 0.6).toFixed(2)}`);
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold font-sans px-2 py-1.5 rounded-md flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">sell</span>
                          Markdown 40%
                        </button>
                        <button
                          onClick={() => {
                            onDiscardProduct(prd.id);
                            alert("Decayed product batch successfully purged from the active stock levels.");
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold font-sans px-2 py-1.5 rounded-md flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">delete_sweep</span>
                          Purge Batch
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
