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
      const res = await apiClient.get(`/api/suppliers?search=${search}&page=${page}&limit=20`);
      if (res?.data && Array.isArray(res.data)) {
        setSuppliers(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (Array.isArray(res)) {
        setSuppliers(res);
        setTotalPages(1);
      } else {
        setSuppliers([]);
      }
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
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-black text-[#11327c] tracking-tight">Supplier Directory</h2>
          <p className="text-[13px] text-gray-500 font-medium">Manage wholesale distributors, procurement invoices, and GSTIN credentials.</p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-black uppercase tracking-wider border ${
                  message.type === "success" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertCircle size={16} strokeWidth={3} />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-3 px-6 py-3.5 bg-[#11327c] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-[#1e4db7] shadow-lg shadow-[#11327c]/20 active:scale-95 shrink-0"
          >
            <Plus size={18} strokeWidth={3} />
            Register Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#11327c] flex items-center justify-center shrink-0">
             <Building2 size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Distributors</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{suppliers.length} Active</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
             <IndianRupee size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Outstanding</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">₹{totalOutstanding.toFixed(2)}</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
             <AlertCircle size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Accounts Payable</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{suppliersWithDue} Accounts</h2>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] p-8">
        {/* Search Bar */}
        <div className="relative mb-10 group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] transition-colors" size={20} strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search by distributor name, contact person, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-20">
            <Loader2 className="animate-spin text-[#11327c] mb-4" size={48} strokeWidth={1.5} />
            <p className="text-[10px] font-black uppercase tracking-widest">Retrieving distributors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {suppliers.map((supplier, idx) => (
                <motion.div
                  key={supplier._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-6 rounded-[32px] border border-gray-100 bg-white hover:border-[#11327c]/20 hover:shadow-[0_20px_50px_-15px_rgba(17,50,124,0.1)] transition-all text-left flex flex-col justify-between gap-5"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#11327c]/30 group-hover:bg-[#11327c] group-hover:text-white transition-all shrink-0">
                        <Building2 size={24} strokeWidth={2.5} />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(supplier)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#11327c] hover:bg-gray-100 transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit size={16} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSupplier(supplier._id, supplier.name)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Supplier"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Name & Contact */}
                    <div className="mt-4">
                      <h3 className="text-[16px] font-black text-[#11327c] uppercase tracking-tight line-clamp-1">{supplier.name}</h3>
                      {supplier.contactPerson && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                          <Contact size={12} className="text-orange-500 shrink-0" />
                          <span>POC: {supplier.contactPerson}</span>
                        </div>
                      )}
                    </div>

                    {/* Details list */}
                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
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
                          <span className="text-emerald-600 font-mono text-[10px] font-black">{supplier.gstin}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-start gap-2.5">
                          <MapPin size={12} className="text-rose-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[10px] tracking-tight">{supplier.address}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Outstanding Balance */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Amount</p>
                          <p className={`text-[18px] font-black tracking-tight ${supplier.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                             ₹{(supplier.outstandingBalance || 0).toFixed(2)}
                          </p>
                       </div>
                       {supplier.outstandingBalance > 0 && (
                          <button 
                             onClick={() => handleOpenPaymentModal(supplier)}
                             className="bg-black text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md shadow-black/10 active:scale-95"
                          >
                             Settle Bill
                          </button>
                       )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {suppliers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-20">
                <Building2 size={64} strokeWidth={1} className="text-gray-400 mb-6" />
                <div className="text-center">
                  <p className="text-[#11327c] font-black text-sm uppercase tracking-widest">No Suppliers Found</p>
                  <p className="text-gray-400 font-medium text-xs mt-2">Add a new supplier profile to start categorizing inventory batches.</p>
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
              className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl border border-white/20 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Building2 size={24} strokeWidth={2.5}/>
                  </div>
                  <h2 className="text-xl font-black text-[#11327c] uppercase tracking-tight">
                    {editingSupplier ? "Edit Distributor" : "Distributor Registration"}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"
                >
                  <X size={20} strokeWidth={3}/>
                </button>
              </div>
              
              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Distributor / Agency Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Apex Distributors Pvt. Ltd."
                    value={supplierForm.name}
                    onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Contact Person</label>
                    <input 
                      type="text" 
                      placeholder="POC Name (e.g. John Doe)"
                      value={supplierForm.contactPerson}
                      onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Contact Number</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit mobile"
                      value={supplierForm.phone}
                      onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="agency@example.com"
                      value={supplierForm.email}
                      onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">GSTIN</label>
                    <input 
                      type="text" 
                      placeholder="15-character GSTIN"
                      value={supplierForm.gstin}
                      onChange={e => setSupplierForm({...supplierForm, gstin: e.target.value.toUpperCase()})}
                      className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300 font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Address</label>
                  <textarea 
                    placeholder="Agency office address..."
                    rows={3}
                    value={supplierForm.address}
                    onChange={e => setSupplierForm({...supplierForm, address: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300 resize-none" 
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-gray-400 font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Dismiss
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-[2] px-6 py-4 rounded-2xl bg-[#11327c] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#11327c]/20 hover:bg-[#1e4db7] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18} strokeWidth={3}/>}
                    {editingSupplier ? "Save Changes" : "Register Distributor"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedSupplierForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#11327c]/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl border border-white/20 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                    <IndianRupee size={24} strokeWidth={2.5}/>
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-[#11327c] uppercase tracking-tight">Make Payment</h2>
                     <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{selectedSupplierForPayment.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"
                >
                  <X size={20} strokeWidth={3}/>
                </button>
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
                 <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest">Total Due:</span>
                    <span className="text-xl font-black">₹{selectedSupplierForPayment.outstandingBalance.toFixed(2)}</span>
                 </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Payment Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    max={selectedSupplierForPayment.outstandingBalance}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[16px] font-black text-gray-900 outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Payment Mode</label>
                  <select 
                    value={paymentForm.method}
                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all"
                  >
                     <option value="Bank Transfer">Bank Transfer</option>
                     <option value="UPI">UPI</option>
                     <option value="Cash">Cash</option>
                     <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-black text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-black/20 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18} strokeWidth={3}/>}
                    Process Payment
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
