import React, { useState } from "react";
import { Product, SalesTransaction, User } from "../types";

interface POSProps {
  currentUser: User;
  products: Product[];
  onCheckout: (paymentMethod: "Cash" | "Card" | "Mobile" | "Bank", customerName: string) => SalesTransaction | null;
}

export default function POSModule({ currentUser, products, onCheckout }: POSProps) {
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [customerName, setCustomerName] = useState("Quick Walk-In");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Mobile" | "Bank">("Cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Real-time printing Receipt modal
  const [lastTrx, setLastTrx] = useState<SalesTransaction | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Cart logic
  const handleAddToCart = (prd: Product) => {
    // Check if enough stock exists
    const existing = cart.find(ci => ci.product.id === prd.id);
    const existingQty = existing ? existing.qty : 0;
    
    if (prd.quantity <= existingQty) {
      alert(`Critical Stock Limit! Only ${prd.quantity} available in current branch.`);
      return;
    }

    if (existing) {
      setCart(cart.map(ci => ci.product.id === prd.id ? { ...ci, qty: ci.qty + 1 } : ci));
    } else {
      setCart([...cart, { product: prd, qty: 1 }]);
    }
  };

  const handleUpdateCartQty = (prdId: string, delta: number) => {
    const existing = cart.find(ci => ci.product.id === prdId);
    if (!existing) return;
    const nextQty = existing.qty + delta;
    if (nextQty <= 0) {
      setCart(cart.filter(ci => ci.product.id !== prdId));
    } else {
      // Validate limit
      if (existing.product.quantity < nextQty) {
        alert("Cannot exceed physical branch inventory.");
        return;
      }
      setCart(cart.map(ci => ci.product.id === prdId ? { ...ci, qty: nextQty } : ci));
    }
  };

  const handleRemoveFromCart = (prdId: string) => {
    setCart(cart.filter(ci => ci.product.id !== prdId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, ci) => acc + (ci.product.sellingPrice * ci.qty), 0);
  const salesTax = subtotal * 0.0825; // 8.25% Sales tax
  const netTotal = subtotal + salesTax;

  const handleCartCheckout = () => {
    if (cart.length === 0) return;
    
    // Inject checkout state
    const createdTrx = onCheckout(paymentMethod, customerName);
    if (createdTrx) {
      setLastTrx(createdTrx);
      setShowInvoice(true);
      setCart([]);
      setCustomerName("Quick Walk-In");
    }
  };

  // Filter Catalog Items
  const filteredProducts = products.filter(prd => {
    const matchesSearch = prd.name.toLowerCase().includes(searchTerm.toLowerCase()) || prd.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || prd.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Catalog selection side */}
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">POS Terminal Register</h3>
          <p className="text-[10px] text-gray-400">Scan barcode or select items below to add them to checkout registry.</p>
        </div>

        {/* Search & Category pills */}
        <div className="space-y-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">barcode_reader</span>
            <input
              type="text"
              placeholder="Fulfill items by name/SKU/UPC code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 text-xs font-sans text-gray-700 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-600 border border-gray-200 transition"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap font-sans transition-all cursor-pointer ${
                selectedCategory === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All Items
            </button>
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap font-sans transition-all cursor-pointer ${
                  selectedCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1 pb-1 custom-scrollbar">
          {filteredProducts.map((prd, i) => {
            const outOfStock = prd.quantity <= 0;
            return (
              <div
                key={i}
                onClick={() => !outOfStock && handleAddToCart(prd)}
                className={`p-3 bg-gray-50 rounded-lg border border-gray-200/60 flex flex-col justify-between hover:border-blue-200 transition-all cursor-pointer select-none relative ${
                  outOfStock ? "opacity-55 cursor-not-allowed" : ""
                }`}
              >
                <div>
                  <div className="relative h-20 rounded-xl overflow-hidden mb-2 bg-white">
                    <img
                      src={prd.imageUrl}
                      alt={prd.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {outOfStock && (
                      <span className="absolute inset-0 bg-black/60 text-white flex items-center justify-center font-bold text-[9px] font-mono tracking-widest uppercase">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-800 font-sans truncate">{prd.name}</h4>
                  <span className="text-[9px] text-gray-400 font-mono display block mt-0.5">SKU: {prd.sku}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-200/50 pt-2">
                  <span className="text-xs font-mono font-extrabold text-[#191c1e]">${prd.sellingPrice.toFixed(2)}</span>
                  <span className="text-[9px] font-semibold text-gray-400 font-mono">Qty: {prd.quantity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart checkout ledger side */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Active Cash Cart</h3>
            <span className="text-[9px] text-[#A2A4A7] font-mono font-bold">CASHIER REG: {currentUser.name}</span>
          </div>
          <button
            onClick={() => setCart([])}
            className="text-rose-600 bg-rose-50 hover:bg-rose-100 text-[10px] font-semibold font-sans px-2.5 py-1 rounded-lg"
          >
            Clear Ledger
          </button>
        </div>

        {/* Customer name and checkout instruments input */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">CRM Customer</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-sans text-gray-700"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-sans text-gray-700"
            >
              <option value="Cash">💵 Cash Drawer</option>
              <option value="Card">💳 Credit Terminal</option>
              <option value="Mobile">📱 Mobile Pay Code</option>
              <option value="Bank">🏦 Bank Draft ACH</option>
            </select>
          </div>
        </div>

        {/* Cart items list */}
        <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs font-sans">
              <span className="material-symbols-outlined text-4xl text-gray-300 block mb-1">shopping_basket</span>
              Cart is currently empty. Click catalogs on left.
            </div>
          ) : (
            cart.map((ci, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-gray-800 font-sans truncate max-w-[170px]">{ci.product.name}</h4>
                  <div className="flex gap-1.5 font-mono text-[9px] text-[#A2A4A7] mt-0.5">
                    <span>${ci.product.sellingPrice.toFixed(2)} /unit</span>
                    <span>&bull;</span>
                    <span>Total: ${(ci.product.sellingPrice * ci.qty).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quantity incrementors */}
                  <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                    <button
                      onClick={() => handleUpdateCartQty(ci.product.id, -1)}
                      className="px-2 py-1 text-xs text-gray-500 font-bold hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-gray-800">{ci.qty}</span>
                    <button
                      onClick={() => handleUpdateCartQty(ci.product.id, 1)}
                      className="px-2 py-1 text-xs text-gray-500 font-bold hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(ci.product.id)}
                    className="material-symbols-outlined text-rose-500 hover:text-rose-700 text-lg"
                  >
                    delete_forever
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dynamic checkout margins and tax formulas */}
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
          <div className="flex justify-between text-xs text-gray-500 font-sans">
            <span>Subtotal:</span>
            <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-sans">
            <span>Sales Tax (8.25%):</span>
            <span className="font-mono font-bold">${salesTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-800 border-t border-gray-200/50 pt-2 font-bold font-sans">
            <span>Total Payable:</span>
            <span className="font-mono text-blue-600 text-sm font-extrabold">${netTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Fire checkout trigger */}
        <button
          onClick={handleCartCheckout}
          disabled={cart.length === 0}
          className="w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-none transition-all disabled:opacity-40 cursor-pointer"
        >
          Finalize & Fulfill Invoice
        </button>
      </div>

      {/* Simulated Receipt Dialog Modal */}
      {showInvoice && lastTrx && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-sm w-full p-6 shadow-2xl relative space-y-6">
            {/* Header branding */}
            <div className="text-center font-sans space-y-1">
              <span className="material-symbols-outlined text-blue-600 text-3xl">task_alt</span>
              <h4 className="text-sm font-bold text-gray-950">SHOPNEST POS INVOICE</h4>
              <p className="text-[10px] text-gray-400">Tax Bill & Receipt &bull; Flagship Unit #01</p>
            </div>

            {/* Core receipt data */}
            <div className="space-y-1 text-[11px] font-mono text-gray-500 border-y border-dashed border-gray-200 py-3">
              <div className="flex justify-between">
                <span>Transaction:</span>
                <span className="text-gray-800 font-bold">{lastTrx.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="text-gray-800">{lastTrx.dateTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Staff Cashier:</span>
                <span className="text-gray-800">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span>CRM Segment:</span>
                <span className="text-[#1b5e35] font-bold">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Core:</span>
                <span className="text-gray-800">{paymentMethod} Instrument</span>
              </div>
            </div>

            {/* List items logged */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
              {lastTrx.items.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px] font-mono text-gray-600">
                  <span>{item.productName} (x{item.quantity})</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total blocks */}
            <div className="border-t border-dashed border-gray-200 pt-3 text-[11px] font-mono text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Net subtotal:</span>
                <span className="text-gray-800">${(lastTrx.amount / 1.0825).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (8.25% State):</span>
                <span className="text-gray-800">${(lastTrx.amount - (lastTrx.amount / 1.0825)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-blue-600 pt-1">
                <span>TOTAL COLLECTED:</span>
                <span>${lastTrx.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Bottom operations */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  alert("Invoice PDF successfully triggered to print queues!");
                }}
                className="w-full text-center py-2 bg-gray-900 text-white rounded-xl text-xs font-bold font-sans shadow hover:bg-black"
              >
                Print Invoice slip
              </button>
              <button
                onClick={() => {
                  alert(`Invoice ledger receipt emitted to ${currentUser.email}!`);
                }}
                className="w-full text-center py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold font-sans"
              >
                Send Email Fulfill
              </button>
              <button
                onClick={() => setShowInvoice(false)}
                className="w-full text-center py-1.5 text-[10px] text-gray-400 hover:text-gray-600 font-semibold font-sans uppercase tracking-widest mt-2"
              >
                Close Register Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
