"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Search, 
  Trash2, 
  Edit, 
  Phone, 
  MapPin, 
  X, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Contact, 
  FileText,
  AlertCircle,
  IndianRupee,
  CreditCard} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "Bank Transfer", reference: "" });
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstin: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      fetchSuppliers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, page]);

  const fetchSuppliers = async () => {
    try {
      const handleData = (res: any) => {
        if (res?.data && Array.isArray(res.data)) {
          setSuppliers(res.data);
          setTotalPages(res.pagination?.totalPages || 1);
        } else if (Array.isArray(res)) {
          setSuppliers(res);
          setTotalPages(1);
        } else {
          setSuppliers([]);
        }
      };
      await apiClient.get(`/api/suppliers?search=${search}&page=${page}&limit=20`, {}, handleData).then(handleData);
    } catch (error) {
      console.error("Failed to fetch suppliers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      gstin: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      gstin: supplier.gstin || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        // Edit Supplier
        await apiClient.put("/api/suppliers", {
          _id: editingSupplier._id,
          ...supplierForm
        });
        showNotification("Supplier updated successfully", "success");
      } else {
        // Add Supplier
        await apiClient.post("/api/suppliers", supplierForm);
        showNotification("Supplier registered successfully", "success");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showNotification(err.message || "Failed to save supplier details.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (supplier: any) => {
    setSelectedSupplierForPayment(supplier);
    setPaymentForm({ amount: supplier.outstandingBalance?.toString() || "", method: "Bank Transfer", reference: "" });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) return;

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/suppliers/pay", {
        supplierId: selectedSupplierForPayment._id,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference
      });
      showNotification("Payment recorded successfully", "success");
      setIsPaymentModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showNotification(err.message || "Failed to process payment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await apiClient.delete(`/api/suppliers?id=${id}`);
      showNotification("Supplier deleted successfully", "success");
      fetchSuppliers();
    } catch (err: any) {
      showNotification(err.message || "Failed to delete supplier.", "error");
    }
  };

  const showNotification = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
  const suppliersWithDue = suppliers.filter(s => (s.outstandingBalance || 0) > 0).length;

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider border animate-fade-in ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50"
                    : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={16} strokeWidth={2.6} /> : <AlertCircle size={16} strokeWidth={2.6} />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleOpenAddModal}
            className="btn-primary btn-md shrink-0"
          >
            <Plus size={17} strokeWidth={2.4} />
            Register Supplier
          </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#11327c] to-[#1e58b8] text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
             <Building2 size={22} strokeWidth={2.3} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Total Distributors</p>
             <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{suppliers.length} Active</h2>
           </div>
        </div>
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
             <IndianRupee size={22} strokeWidth={2.3} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Outstanding Dues</p>
             <h2 className="font-display text-[22px] font-extrabold text-red-600 dark:text-red-400 tracking-tighter">₹{totalOutstanding.toLocaleString()}</h2>
           </div>
        </div>
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
             <CreditCard size={22} strokeWidth={2.3} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">With Outstanding Balance</p>
             <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{suppliersWithDue} Suppliers</h2>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="surface-card p-6 md:p-8">
        {/* Search Bar */}
        <div className="relative mb-6 group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} strokeWidth={2.4} />
          <input
            type="text"
            placeholder="Search by distributor name, contact person, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12 h-12"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary mb-4" size={40} strokeWidth={1.5} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Retrieving distributors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {suppliers.map((supplier, idx) => (
                <motion.div
                  key={supplier._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-5 rounded-2xl border border-border bg-card hover:border-primary/25 hover:shadow-lift transition-all text-left flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                        <Building2 size={23} strokeWidth={2.3} />
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(supplier)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-accent transition-colors cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit size={16} strokeWidth={2.4} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSupplier(supplier._id, supplier.name)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Delete Supplier"
                        >
                          <Trash2 size={16} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>

                    {/* Name & Contact */}
                    <div className="mt-4">
                      <h3 className="font-display text-[15px] font-extrabold text-foreground tracking-tight line-clamp-1">{supplier.name}</h3>
                      {supplier.contactPerson && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">
                          <Contact size={12} className="text-amber-500 shrink-0" />
                          <span>POC: {supplier.contactPerson}</span>
                        </div>
                      )}
                    </div>

                    {/* Details list */}
                    <div className="mt-4 pt-4 border-t border-border/70 space-y-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {supplier.phone && (
                        <div className="flex items-center gap-2.5">
                          <Phone size={12} className="text-indigo-400 shrink-0" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2.5 normal-case">
                          <Mail size={12} className="text-blue-400 shrink-0" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.gstin && (
                        <div className="flex items-center gap-2.5">
                          <FileText size={12} className="text-emerald-400 shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">{supplier.gstin}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-start gap-2.5">
                          <MapPin size={12} className="text-rose-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[10px] tracking-tight">{supplier.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outstanding balance + pay */}
                  {(supplier.outstandingBalance || 0) > 0 && (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-50/70 dark:bg-red-950/30 ring-1 ring-inset ring-red-100 dark:ring-red-900/40">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-red-500/80">Outstanding</div>
                        <div className="font-display text-[15px] font-extrabold text-red-600 dark:text-red-400">₹{(supplier.outstandingBalance || 0).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => handleOpenPaymentModal(supplier)}
                        className="btn-danger btn-sm"
                      >
                        <CreditCard size={14} strokeWidth={2.4} />
                        Pay
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {suppliers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
                  <Building2 size={28} strokeWidth={1.5} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-bold text-sm tracking-wide">No Suppliers Found</p>
                  <p className="text-muted-foreground font-medium text-xs mt-2">Add a new supplier profile to start categorizing inventory batches.</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#11327c]/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-xl rounded-3xl shadow-pop border border-border overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-400 text-white rounded-xl flex items-center justify-center shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
                    <Building2 size={23} strokeWidth={2.3}/>
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-foreground uppercase tracking-tight">
                    {editingSupplier ? "Edit Distributor" : "Distributor Registration"}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} strokeWidth={2.6}/>
                </button>
              </div>
              
              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                <div>
                  <label className="label">Distributor / Agency Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Apex Distributors Pvt. Ltd."
                    value={supplierForm.name}
                    onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                    className="input" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Contact Person</label>
                    <input 
                      type="text" 
                      placeholder="POC Name (e.g. John Doe)"
                      value={supplierForm.contactPerson}
                      onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})}
                      className="input" 
                    />
                  </div>
                  <div>
                    <label className="label">Contact Number</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit mobile"
                      value={supplierForm.phone}
                      onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                      className="input" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="agency@example.com"
                      value={supplierForm.email}
                      onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                      className="input" 
                    />
                  </div>
                  <div>
                    <label className="label">GSTIN</label>
                    <input 
                      type="text" 
                      placeholder="15-character GSTIN"
                      value={supplierForm.gstin}
                      onChange={e => setSupplierForm({...supplierForm, gstin: e.target.value.toUpperCase()})}
                      className="input font-mono" 
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Address</label>
                  <textarea 
                    placeholder="Agency office address..."
                    rows={3}
                    value={supplierForm.address}
                    onChange={e => setSupplierForm({...supplierForm, address: e.target.value})}
                    className="input h-auto py-3 resize-none" 
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="btn-outline btn-lg flex-1 uppercase tracking-widest"
                  >
                    Dismiss
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-primary btn-lg flex-[2] uppercase tracking-widest"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18} strokeWidth={2.6}/>}
                    {editingSupplier ? "Save Changes" : "Register Distributor"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedSupplierForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-md rounded-3xl shadow-pop border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-400 text-white rounded-xl flex items-center justify-center shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
                    <CreditCard size={22} strokeWidth={2.3}/>
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-extrabold text-foreground tracking-tight">Record Payment</h2>
                    <p className="text-[12px] text-muted-foreground font-semibold mt-0.5">{selectedSupplierForPayment.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} strokeWidth={2.6}/>
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/30 ring-1 ring-inset ring-red-100 dark:ring-red-900/40 flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-red-500/80">Outstanding Balance</span>
                  <span className="font-display text-[20px] font-extrabold text-red-600 dark:text-red-400">₹{(selectedSupplierForPayment.outstandingBalance || 0).toLocaleString()}</span>
                </div>

                <div>
                  <label className="label">Payment Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Payment Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                    className="select"
                  >
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="label">Reference / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR no., cheque no."
                    value={paymentForm.reference}
                    onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}
                    className="input"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="btn-outline btn-lg flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-danger btn-lg flex-[2]"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18} strokeWidth={2.6}/>}
                    Confirm Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
