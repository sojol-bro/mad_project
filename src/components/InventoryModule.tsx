import React, { useState } from "react";
import { Product, Category, Supplier } from "../types";

interface InventoryProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onAddProduct: (p: Omit<Product, "id" | "status">) => void;
  onUpdateQty: (productId: string, newQty: number) => void;
}

export default function InventoryModule({
  products,
  categories,
  suppliers,
  onAddProduct,
  onUpdateQty
}: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price_desc" | "qty_asc">("name");

  // Selection states
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(products[0] || null);
  const [isOpeningAddForm, setIsOpeningAddForm] = useState(false);

  // New product form states
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0]?.name || "Gourmet Food");
  const [newBrand, setNewBrand] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCost, setNewCost] = useState(0);
  const [newSelling, setNewSelling] = useState(0);
  const [newQty, setNewQty] = useState(1);
  const [newReorder, setNewReorder] = useState(10);
  const [newExpiry, setNewExpiry] = useState("");
  const [newBatch, setNewBatch] = useState("");
  const [newSupplier, setNewSupplier] = useState(suppliers[0]?.id || "");

  // Auto-fill SKU generator helper
  const handleGenerateSKU = () => {
    const codes: Record<string, string> = {
      "Premium Electronics": "ELC",
      "Artisanal Beverages": "BEV",
      "Athletic Wear": "ATH",
      "Organic Dry Goods": "FOD",
      "Home Accessories": "HOM"
    };
    const prefix = codes[newCategory] || "GEN";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNewSku(`${prefix}-${newBrand.substring(0,3).toUpperCase() || "SHP"}-${rand}`);
    setNewBarcode(`74${Math.floor(100000000 + Math.random() * 900000000)}`);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSku) return;

    onAddProduct({
      name: newName,
      sku: newSku,
      barcode: newBarcode || "884920" + Math.floor(100000 + Math.random() * 900000),
      category: newCategory,
      brand: newBrand || "Generic",
      description: newDesc,
      costPrice: Number(newCost) || 0,
      sellingPrice: Number(newSelling) || 0,
      quantity: Number(newQty) || 0,
      reorderLevel: Number(newReorder) || 10,
      expiryDate: newExpiry || undefined,
      batchNumber: newBatch || undefined,
      supplierId: newSupplier || undefined,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80"
    });

    // Reset fields
    setNewName("");
    setNewSku("");
    setNewBarcode("");
    setNewBrand("");
    setNewDesc("");
    setNewCost(0);
    setNewSelling(0);
    setNewQty(1);
    setNewReorder(10);
    setNewExpiry("");
    setNewBatch("");
    setIsOpeningAddForm(false);
  };

  // Math aggregates
  const totalValue = products.reduce((acc, p) => acc + (p.costPrice * p.quantity), 0);
  const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
  const lowItems = products.filter(p => p.quantity <= p.reorderLevel);

  // Filter & Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || p.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "price_desc") return b.sellingPrice - a.sellingPrice;
    if (sortBy === "qty_asc") return a.quantity - b.quantity;
    return a.name.localeCompare(b.name);
  });

  const getStatusColor = (status: string) => {
    if (status === "Critical") return "bg-rose-50 text-rose-700 border-rose-200";
    if (status === "Expiring") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      {/* Mini Aggregates Card */}
      <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-center py-2 border-r border-gray-100">
          <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wider block">Total Catalog Worth</span>
          <span className="text-sm font-extrabold text-emerald-900 font-mono block mt-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="text-center py-2 border-r border-gray-100">
          <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wider block">Total Stock Units</span>
          <span className="text-sm font-extrabold text-gray-800 font-mono block mt-1">{totalItems.toLocaleString()} items</span>
        </div>
        <div className="text-center py-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wider block">Low Stock Alert</span>
          <span className="text-sm font-extrabold text-amber-600 font-mono block mt-1">{lowItems.length} units</span>
        </div>
      </div>

      {/* Main Core split: Product List side & Detail Panel inspect side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Selection list with Filters */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Enterprise Master Catalog</h3>
              <p className="text-[10px] text-gray-400">Search and explore products. Select row to deep-inspect details.</p>
            </div>
            <button
              onClick={() => setIsOpeningAddForm(!isOpeningAddForm)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs font-sans px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">add_box</span>
              {isOpeningAddForm ? "View Catalog" : "Add New Goods"}
            </button>
          </div>

          {/* Core filters (only if not viewing Add form) */}
          {!isOpeningAddForm && (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Filter by SKU, Brand, Barcode or Desc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-700 focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              {/* Categorical filters */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-gray-55 border border-gray-200 text-[10px] font-sans text-gray-700 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c, i) => (
                      <option key={i} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Stock status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-gray-55 border border-gray-200 text-[10px] font-sans text-gray-700 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="all">All States</option>
                    <option value="critical">Critical (Low)</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="healthy">Healthy</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Ordering</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-gray-55 border border-gray-200 text-[10px] font-sans text-gray-700 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price_desc">Price: Highest First</option>
                    <option value="qty_asc">Qty: Critical First</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sliding views: Add Form VS Catalog list */}
          {isOpeningAddForm ? (
            /* Add product React form */
            <form onSubmit={handleCreateProduct} className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-2 p-1 border-b border-gray-200">
                <span className="material-symbols-outlined text-blue-600">edit_note</span>
                <h4 className="text-xs font-bold text-gray-800 font-sans">New Procurement Catalog Registry</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arabica Roast: Colombia Supremo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Main Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-sans"
                  >
                    {categories.map((c, i) => (
                      <option key={i} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Producer Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. ShopNest Reserve"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-sans focus:outline-none"
                  />
                </div>

                <div className="col-span-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-center justify-between gap-2">
                  <div className="w-full">
                    <label className="text-[9px] uppercase font-bold text-blue-800 block mb-0.5">Automated SKU & Barcode</label>
                    <div className="flex gap-2 text-xs font-mono font-bold text-blue-955">
                      <span>{newSku || "[PENDING GENERATION]"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSKU}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg font-sans cursor-pointer"
                  >
                    Auto Generate
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="12.50"
                    value={newCost || ""}
                    onChange={(e) => {
                      setNewCost(Number(e.target.value));
                      // Set default selling with healthy margin if null
                      if(!newSelling) setNewSelling(Number((Number(e.target.value) * 1.6).toFixed(2)));
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={newSelling || ""}
                    onChange={(e) => setNewSelling(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Initial stock quantity</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Reorder Threshold Warn</label>
                  <input
                    type="number"
                    value={newReorder}
                    onChange={(e) => setNewReorder(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Assign Vendor</label>
                  <select
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-sans focus:outline-none"
                  >
                    {suppliers.map((s, i) => (
                      <option key={i} value={s.id}>{s.name} - Fulfillment: {s.fulfillmentRatePct}%</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Physical Description</label>
                  <textarea
                    placeholder="Specify container details, size limits, or flavor profile logs..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none h-16"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Expiring Date (Optional)</label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-1 text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Batch Key (Optional)</label>
                  <input
                    type="text"
                    placeholder="BATCH-LAT-09"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none"
                  />
                </div>
              </div>

              {/* Profit margin estimation display */}
              {newCost > 0 && newSelling > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-blue-950 font-sans">Profit margin projection:</span>
                  <span className="font-mono text-blue-600">
                    +${(newSelling - newCost).toFixed(2)} ({(((newSelling - newCost)/newSelling)*100).toFixed(1)}%)
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpeningAddForm(false)}
                  className="w-1/2 text-center py-2 bg-white text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 font-sans font-semibold text-xs cursor-pointer"
                >
                  Discard Form
                </button>
                <button
                  type="submit"
                  disabled={!newName || !newSku}
                  className="w-1/2 text-center py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-sans font-bold text-xs shadow-none disabled:opacity-40 cursor-pointer"
                >
                  Commit to Inventory
                </button>
              </div>
            </form>
          ) : (
            /* Standard scrollable catalog list */
            <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  <span className="material-symbols-outlined text-4xl text-gray-300 block mb-1">search_off</span>
                  No products matched the current credentials.
                </div>
              ) : (
                filteredProducts.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => setInspectedProduct(p)}
                    className={`p-3 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                      inspectedProduct?.id === p.id ? "bg-blue-50/75 border border-blue-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-gray-900 font-sans truncate max-w-[170px]">{p.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[9px] text-gray-400">
                          <span>SKU: {p.sku}</span>
                          <span>&bull;</span>
                          <span className="bg-gray-100 text-gray-600 px-1 rounded font-bold">{p.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-gray-800">${p.sellingPrice.toFixed(2)}</span>
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold border uppercase tracking-wider ${getStatusColor(p.status)}`}>
                          {p.status === "Critical" ? `Low Qty: ${p.quantity}` :
                           p.status === "Expiring" ? `Expiring` : `${p.quantity} Units`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side: Luxurious Detailed Inspection View */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-gray-200 shadow-none p-6 space-y-6">
          {inspectedProduct ? (
            <div className="space-y-6">
              {/* Product header & photo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1e40af] bg-blue-50 border border-blue-250 px-2.5 py-1 rounded-full font-mono">
                    Product Profile Inspect
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">ID: {inspectedProduct.id}</span>
                </div>

                <div className="relative h-44 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                  <img
                    src={inspectedProduct.imageUrl}
                    alt={inspectedProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent"></div>
                  
                  {/* Status pill on image */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-sm font-bold font-sans truncate max-w-[240px]">{inspectedProduct.name}</h3>
                    <span className="text-[10px] text-blue-300 font-mono mt-0.5 block">{inspectedProduct.brand}</span>
                  </div>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Universal Barcode Layout</span>
                  <span className="text-xs font-mono font-bold text-gray-700 block mt-0.5">{inspectedProduct.barcode}</span>
                </div>
                {/* Simulated SVG Barcode lines */}
                <div className="flex bg-white py-1 px-2.5 rounded border border-gray-200 gap-0.5 items-center">
                  <span className="w-[1.5px] h-7 bg-black"></span>
                  <span className="w-[1px] h-7 bg-black"></span>
                  <span className="w-[3px] h-7 bg-black"></span>
                  <span className="w-[1px] h-7 bg-black"></span>
                  <span className="w-[2px] h-7 bg-black"></span>
                  <span className="w-[1.5px] h-7 bg-black"></span>
                  <span className="w-[1px] h-7 bg-black"></span>
                  <span className="w-[3.5px] h-7 bg-black"></span>
                  <span className="w-[1px] h-7 bg-black"></span>
                  <span className="w-[2px] h-7 bg-black"></span>
                </div>
              </div>

              {/* Slider stock editor */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs font-sans font-bold">
                  <span className="text-gray-700">Reactive Quantity:</span>
                  <span className="font-mono text-blue-600">{inspectedProduct.quantity} units</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  value={inspectedProduct.quantity}
                  onChange={(e) => onUpdateQty(inspectedProduct.id, Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[9px] text-[#A2A4A7] font-mono font-bold">
                  <span>CRITICAL (0 - {inspectedProduct.reorderLevel})</span>
                  <span>MID (500)</span>
                  <span>MAX STOCK (1500)</span>
                </div>
              </div>

              {/* Multi-margin Profit analysis */}
              <div className="grid grid-cols-2 gap-4 bg-[#fcfdfe] border border-gray-100 p-4 rounded-xl">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Acquisition (Cost)</span>
                  <span className="text-sm font-extrabold font-mono text-gray-800 block mt-0.5">${inspectedProduct.costPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Retail Price (Sell)</span>
                  <span className="text-sm font-extrabold font-mono text-gray-800 block mt-0.5">${inspectedProduct.sellingPrice.toFixed(2)}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-100 flex justify-between items-center text-xs font-sans font-semibold">
                  <span className="text-gray-500">Gross Margin Percent:</span>
                  <span className="font-mono text-blue-600">
                    +{(( (inspectedProduct.sellingPrice - inspectedProduct.costPrice) / inspectedProduct.sellingPrice ) * 100).toFixed(1)}% 
                    <span className="text-gray-400 text-[10px] font-normal ml-1">
                      (${ (inspectedProduct.sellingPrice - inspectedProduct.costPrice).toFixed(2) } net)
                    </span>
                  </span>
                </div>
              </div>

              {/* Expiry and Supplier links */}
              <div className="space-y-2 text-xs font-sans text-gray-600">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-400">Batch Number:</span>
                  <span className="font-mono font-semibold">{inspectedProduct.batchNumber || "UNBATCHED"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-400">Earliest Expiry:</span>
                  <span className="font-mono font-semibold text-rose-600">{inspectedProduct.expiryDate || "NEVER EXPIRES"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-400">Preferred Supplier:</span>
                  <span className="font-semibold text-blue-605 font-sans">
                    {suppliers.find(s => s.id === inspectedProduct.supplierId)?.name || "Global Bean Importers Co."}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 font-sans">
              <span className="material-symbols-outlined text-4xl text-gray-300 block mb-1">visibility</span>
              Select any product in the corporate ledger to inspect its detailed specifications, barcodes, margins, and reorder levels.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
