"use client";

import { useEffect, useState } from "react";
import { Users, Search, PackagePlus, Trash2, Edit, Phone, MapPin, Activity, X, Plus, UserPlus, CreditCard, Stethoscope, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";

export default function PatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [medSearch, setMedSearch] = useState("");
    const [medResults, setMedResults] = useState<any[]>([]);

    // Add Patient State
    const [isAddingPatient, setIsAddingPatient] = useState(false);
    const [newPatientForm, setNewPatientForm] = useState({ name: "", phone: "", doctorName: "", address: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        setLoading(true);
        const timeoutId = setTimeout(() => {
            fetchPatients();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, page]);

    const fetchPatients = async () => {
        try {
            const res = await apiClient.get(`/api/patients?search=${search}&page=${page}&limit=20`);
            
            if (res?.data && Array.isArray(res.data)) {
                setPatients(res.data);
                setTotalPages(res.pagination?.totalPages || 1);
            } else if (Array.isArray(res)) {
                setPatients(res);
                setTotalPages(1);
            } else {
                setPatients([]);
            }
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPatientForm.name || !newPatientForm.phone) {
            return;
        }
        
        setIsSubmitting(true);
        try {
            await apiClient.post("/api/patients", newPatientForm);
            setIsAddingPatient(false);
            setNewPatientForm({ name: "", phone: "", doctorName: "", address: "" });
            fetchPatients();
        } catch (err) {
            alert("Failed to create patient. Phone number might already exist.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Global Medicine Search for adding to Regular Prescriptions
    useEffect(() => {
        if (medSearch.length < 2) {
            setMedResults([]);
            return;
        }
        const delaySearch = setTimeout(async () => {
            try {
                const res = await apiClient.get(`/api/inventory?q=${medSearch}`);
                const uniqueMeds = new Map();
                for (const item of (res || [])) {
                    if (!uniqueMeds.has(item.medicineId)) {
                        uniqueMeds.set(item.medicineId, {
                            _id: item.medicineId,
                            name: item.name,
                            brand: item.brand
                        });
                    }
                }
                setMedResults(Array.from(uniqueMeds.values()));
            } catch (err) {
                console.error(err);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [medSearch]);

    const addRegularMedicine = async (med: any) => {
        if (!selectedPatient) return;
        
        const existing = selectedPatient.regularMedicines?.find((r: any) => r.medicineId === med._id);
        if (existing) return;

        const updatedList = [
            ...(selectedPatient.regularMedicines || []),
            { medicineId: med._id, name: med.name, dosageInstructions: "" }
        ];

        try {
            const res = await apiClient.post("/api/patients", {
                phone: selectedPatient.phone,
                regularMedicines: updatedList
            });
            setSelectedPatient(res);
            setMedSearch("");
            setMedResults([]);
            fetchPatients();
        } catch (err) {
            console.error("Failed to update prescription", err);
        }
    };

    const removeRegularMedicine = async (medicineId: string) => {
        if (!selectedPatient) return;

        const updatedList = selectedPatient.regularMedicines.filter((r: any) => r.medicineId !== medicineId);

        try {
            const res = await apiClient.post("/api/patients", {
                phone: selectedPatient.phone,
                regularMedicines: updatedList
            });
            setSelectedPatient(res);
            fetchPatients();
        } catch (err) {
            console.error("Failed to delete medicine", err);
        }
    };

    return (
        <div className="space-y-8 pb-10 max-w-[1400px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-[28px] font-black text-[#11327c] tracking-tight">Patient CRM</h2>
                    <p className="text-[13px] text-gray-500 font-medium">Manage customer health profiles and chronic prescriptions.</p>
                </div>
                <button 
                    onClick={() => setIsAddingPatient(true)}
                    className="flex items-center gap-3 px-6 py-3.5 bg-[#11327c] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-[#1e4db7] shadow-lg shadow-[#11327c]/20 active:scale-95"
                >
                    <UserPlus size={18} strokeWidth={3} />
                    Register Patient
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] p-8">
                {/* Search Bar */}
                <div className="relative mb-10 group max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] transition-colors" size={20} strokeWidth={2.5} />
                    <input
                        type="text"
                        placeholder="Search by name, phone or identifier..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-20">
                        <Loader2 className="animate-spin text-[#11327c] mb-4" size={48} strokeWidth={1.5} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Database...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {patients.map((patient, idx) => (
                                <motion.button
                                    key={patient._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedPatient(patient)}
                                    className="group relative p-6 rounded-[32px] border border-gray-100 bg-white hover:border-[#11327c]/20 transition-all text-left flex flex-col gap-5 hover:shadow-[0_20px_50px_-15px_rgba(17,50,124,0.1)] active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#11327c]/30 group-hover:bg-[#11327c] group-hover:text-white transition-all">
                                            <Users size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                ₹{patient.totalSpent.toLocaleString()}
                                            </div>
                                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Total Value</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[16px] font-black text-[#11327c] group-hover:text-[#11327c] transition-colors uppercase tracking-tight">{patient.name}</h3>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                                            <Phone size={12} className="text-orange-500" />
                                            {patient.phone}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                <Activity size={12} className="text-indigo-400" />
                                                {patient.regularMedicines?.length || 0} RX
                                            </div>
                                            {patient.doctorName && (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px]">
                                                    <Stethoscope size={12} className="text-rose-400" />
                                                    {patient.doctorName}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={16} className="text-gray-200 group-hover:text-[#11327c] group-hover:translate-x-1 transition-all" strokeWidth={3} />
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {patients.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-20">
                                <Users size={64} strokeWidth={1} className="text-gray-400 mb-6" />
                                <div className="text-center">
                                    <p className="text-[#11327c] font-black text-sm uppercase tracking-widest">No Patients Found</p>
                                    <p className="text-gray-400 font-medium text-xs mt-2">Adjust your filters or register a new patient profile.</p>
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

            {/* Patient Detail Modal */}
            <AnimatePresence>
                {selectedPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#11327c]/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-[#f8fafc]">
                                <div className="flex gap-6">
                                    <div className="w-16 h-16 bg-[#11327c] text-white rounded-3xl flex items-center justify-center shadow-lg shadow-[#11327c]/20">
                                        <Users size={32} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[#11327c] uppercase tracking-tight">{selectedPatient.name}</h2>
                                        <div className="flex flex-wrap items-center gap-5 mt-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">
                                            <span className="flex items-center gap-2"><Phone size={14} className="text-orange-500" /> {selectedPatient.phone}</span>
                                            {selectedPatient.address && <span className="flex items-center gap-2"><MapPin size={14} className="text-[#11327c]" /> {selectedPatient.address}</span>}
                                            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100"><CreditCard size={14} /> ₹{selectedPatient.totalSpent.toLocaleString()} Spent</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all active:scale-90">
                                    <X size={20} strokeWidth={3}/>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[12px] font-black text-[#11327c] uppercase tracking-[0.25em] flex items-center gap-3">
                                        <Activity size={20} className="text-orange-500" strokeWidth={2.5} />
                                        Regular Prescriptions
                                    </h3>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{selectedPatient.regularMedicines?.length || 0} Items Active</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                    {selectedPatient.regularMedicines?.map((med: any) => (
                                        <div key={med.medicineId} className="group flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-[#f8fafc] hover:border-[#11327c]/20 transition-all">
                                            <div>
                                                <div className="text-[13px] font-black text-[#11327c] uppercase tracking-tight">{med.name}</div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Daily Maintenance</div>
                                            </div>
                                            <button 
                                                onClick={() => removeRegularMedicine(med.medicineId)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md"
                                            >
                                                <Trash2 size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedPatient.regularMedicines || selectedPatient.regularMedicines.length === 0) && (
                                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                            <Activity size={32} className="mx-auto text-gray-200 mb-3" />
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No maintenance meds defined</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Rx Search Area */}
                                <div className="bg-[#11327c] p-8 rounded-[32px] text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.25em] mb-4 flex items-center gap-3">
                                            <Search size={16} className="text-orange-400" strokeWidth={3} />
                                            Inventory Rx Search
                                        </h4>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search your master inventory..."
                                                value={medSearch}
                                                onChange={(e) => setMedSearch(e.target.value)}
                                                className="w-full bg-white/10 border border-white/20 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-white/10 focus:bg-white focus:text-[#11327c] transition-all text-[14px] font-bold placeholder:text-white/30"
                                            />
                                            
                                            <AnimatePresence>
                                                {medResults.length > 0 && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute bottom-full mb-3 left-0 right-0 bg-white border border-gray-100 rounded-3xl shadow-2xl z-20 max-h-56 overflow-y-auto p-2"
                                                    >
                                                        {medResults.map((med, idx) => (
                                                            <button
                                                                key={med._id}
                                                                onClick={() => addRegularMedicine(med)}
                                                                className="w-full text-left p-4 hover:bg-[#f8fafc] rounded-2xl flex justify-between items-center group transition-all mb-1 last:mb-0"
                                                            >
                                                                <div>
                                                                    <div className="text-[13px] font-black text-[#11327c] uppercase tracking-tight">{med.name}</div>
                                                                    {med.brand && <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">{med.brand}</div>}
                                                                </div>
                                                                <div className="w-10 h-10 bg-[#11327c] text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-lg">
                                                                    <PackagePlus size={18} strokeWidth={2.5} />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4">
                                        <Stethoscope size={160} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add New Patient Modal */}
            <AnimatePresence>
                {isAddingPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#11327c]/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl border border-white/20 overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                        <UserPlus size={24} strokeWidth={2.5}/>
                                    </div>
                                    <h2 className="text-xl font-black text-[#11327c] uppercase tracking-tight">Patient Registration</h2>
                                </div>
                                <button onClick={() => setIsAddingPatient(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all">
                                    <X size={20} strokeWidth={3}/>
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreatePatient} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Legal Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Full Name"
                                            value={newPatientForm.name}
                                            onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Contact No *</label>
                                        <input 
                                            type="tel" 
                                            required
                                            placeholder="10-digit mobile"
                                            value={newPatientForm.phone}
                                            onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Referring Physician</label>
                                    <div className="relative group">
                                        <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#11327c] transition-colors" size={18} strokeWidth={2.5}/>
                                        <input 
                                            type="text" 
                                            placeholder="Dr. Name (Optional)"
                                            value={newPatientForm.doctorName}
                                            onChange={e => setNewPatientForm({...newPatientForm, doctorName: e.target.value})}
                                            className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Physical Address</label>
                                    <textarea 
                                        placeholder="Full address for records..."
                                        rows={3}
                                        value={newPatientForm.address}
                                        onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})}
                                        className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300 resize-none" 
                                    />
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingPatient(false)}
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
                                        Complete Registration
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
