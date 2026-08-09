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
            const handleData = (res: any) => {
                if (res?.data && Array.isArray(res.data)) {
                    setPatients(res.data);
                    setTotalPages(res.pagination?.totalPages || 1);
                } else if (Array.isArray(res)) {
                    setPatients(res);
                    setTotalPages(1);
                } else {
                    setPatients([]);
                }
            };
            await apiClient.get(`/api/patients?search=${search}&page=${page}&limit=20`, {}, handleData).then(handleData);
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

    const totalSpent = patients.reduce((sum, p) => sum + (p.totalSpent || 0), 0);
    const chronicPatients = patients.filter(p => p.regularMedicines?.length > 0).length;

    return (
        <div className="space-y-8 pb-10 max-w-[1400px] mx-auto">
            {/* Header Actions */}
            <div className="flex justify-end mb-6">
                <button 
                    onClick={() => setIsAddingPatient(true)}
                    className="btn-primary btn-md"
                >
                    <UserPlus size={17} strokeWidth={2.4} />
                    Register Patient
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="surface-card surface-hover p-5 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#11327c] to-[#1e58b8] text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
                     <Users size={22} strokeWidth={2.3} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Total Patients</p>
                     <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{patients.length} Enrolled</h2>
                   </div>
                </div>

                <div className="surface-card surface-hover p-5 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
                     <CreditCard size={22} strokeWidth={2.3} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Lifetime Value</p>
                     <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">₹{totalSpent.toLocaleString()}</h2>
                   </div>
                </div>

                <div className="surface-card surface-hover p-5 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
                     <Activity size={22} strokeWidth={2.3} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Chronic Care</p>
                     <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{chronicPatients} Patients</h2>
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
                        placeholder="Search by name, phone or identifier..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-12 h-12"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} strokeWidth={1.5} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Database...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <AnimatePresence>
                            {patients.map((patient, idx) => (
                                <motion.button
                                    key={patient._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => setSelectedPatient(patient)}
                                    className="group relative p-4 rounded-2xl border border-border bg-card hover:border-primary/25 transition-all text-left flex items-center justify-between gap-5 hover:shadow-lift active:scale-[0.99] w-full"
                                >
                                    <div className="flex items-center gap-5 w-1/3 min-w-[200px]">
                                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                                            <Users size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] font-extrabold text-foreground uppercase tracking-tight">{patient.name}</h3>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">
                                                <Phone size={12} className="text-amber-500" />
                                                {patient.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-1/3 min-w-[200px] justify-center border-l border-r border-border/60 px-6">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <Activity size={14} className="text-indigo-400" />
                                            {patient.regularMedicines?.length || 0} RX
                                        </div>
                                        {patient.doctorName && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[150px]">
                                                <Stethoscope size={14} className="text-rose-400" />
                                                {patient.doctorName}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end items-center gap-4 w-1/3 min-w-[150px]">
                                        <div className="flex flex-col items-end">
                                            <div className="bg-success/12 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest ring-1 ring-inset ring-success/25">
                                                ₹{patient.totalSpent.toLocaleString()}
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Lifetime Value</span>
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all ml-2" strokeWidth={3} />
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {patients.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 w-full">
                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
                                    <Users size={28} strokeWidth={1.5} className="text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-foreground font-bold text-sm tracking-wide">No Patients Found</p>
                                    <p className="text-muted-foreground font-medium text-xs mt-2">Adjust your filters or register a new patient profile.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground font-semibold">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="btn-outline btn-sm disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="btn-outline btn-sm disabled:opacity-40"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card w-full max-w-3xl rounded-3xl shadow-pop border border-border overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-7 border-b border-border flex justify-between items-start bg-muted/40">
                                <div className="flex gap-5">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[#11327c] to-[#1e58b8] text-white rounded-2xl flex items-center justify-center shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-6px_rgb(15_23_42/0.5)]">
                                        <Users size={30} strokeWidth={2.3} />
                                    </div>
                                    <div>
                                        <h2 className="font-display text-2xl font-extrabold text-foreground uppercase tracking-tight">{selectedPatient.name}</h2>
                                        <div className="flex flex-wrap items-center gap-5 mt-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em]">
                                            <span className="flex items-center gap-2"><Phone size={14} className="text-amber-500" /> {selectedPatient.phone}</span>
                                            {selectedPatient.address && <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {selectedPatient.address}</span>}
                                            <span className="badge-success"><CreditCard size={13} /> ₹{selectedPatient.totalSpent.toLocaleString()} Spent</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="w-10 h-10 flex items-center justify-center bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 rounded-xl transition-all active:scale-90 cursor-pointer">
                                    <X size={20} strokeWidth={2.6}/>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-7 overflow-y-auto flex-1">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-[12px] font-extrabold text-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
                                        <Activity size={19} className="text-amber-500" strokeWidth={2.4} />
                                        Regular Prescriptions
                                    </h3>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selectedPatient.regularMedicines?.length || 0} Items Active</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-8">
                                    {selectedPatient.regularMedicines?.map((med: any) => (
                                        <div key={med.medicineId} className="group flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/40 hover:border-primary/25 transition-all">
                                            <div>
                                                <div className="text-[13px] font-extrabold text-foreground uppercase tracking-tight">{med.name}</div>
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Daily Maintenance</div>
                                            </div>
                                            <button 
                                                onClick={() => removeRegularMedicine(med.medicineId)}
                                                className="w-9 h-9 flex items-center justify-center text-muted-foreground/50 hover:text-red-500 hover:bg-card rounded-xl transition-all cursor-pointer"
                                                aria-label={`Remove ${med.name} from prescriptions`}
                                            >
                                                <Trash2 size={16} strokeWidth={2.4} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedPatient.regularMedicines || selectedPatient.regularMedicines.length === 0) && (
                                        <div className="col-span-full text-center py-12 bg-muted/40 rounded-2xl border border-dashed border-border">
                                            <Activity size={30} className="mx-auto text-muted-foreground/40 mb-3" />
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">No maintenance meds defined</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Rx Search Area */}
                                <div className="p-6 rounded-3xl text-white relative overflow-hidden bg-[linear-gradient(160deg,oklch(0.24_0.09_262)_0%,oklch(0.33_0.12_262)_50%,oklch(0.44_0.19_255)_115%)]">
                                    <div
                                        className="absolute inset-0 opacity-[0.06] pointer-events-none"
                                        style={{
                                            backgroundImage:
                                                "linear-gradient(rgb(255 255 255 / 0.6) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.6) 1px, transparent 1px)",
                                            backgroundSize: "26px 26px",
                                        }}
                                    />
                                    <div className="relative z-10">
                                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-[0.22em] mb-3.5 flex items-center gap-2.5">
                                            <Search size={15} className="text-amber-400" strokeWidth={2.6} />
                                            Inventory Rx Search
                                        </h4>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search your master inventory..."
                                                value={medSearch}
                                                onChange={(e) => setMedSearch(e.target.value)}
                                                className="w-full bg-white/10 border border-white/20 px-5 py-3.5 rounded-xl outline-none focus:ring-4 focus:ring-white/10 focus:bg-white focus:text-[#11327c] transition-all text-[14px] font-bold placeholder:text-white/40"
                                            />
                                            
                                            <AnimatePresence>
                                                {medResults.length > 0 && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute bottom-full mb-3 left-0 right-0 bg-card border border-border rounded-2xl shadow-pop z-20 max-h-56 overflow-y-auto p-2"
                                                    >
                                                        {medResults.map((med) => (
                                                            <button
                                                                key={med._id}
                                                                onClick={() => addRegularMedicine(med)}
                                                                className="w-full text-left p-3.5 hover:bg-accent/70 rounded-xl flex justify-between items-center group transition-all mb-1 last:mb-0 cursor-pointer"
                                                            >
                                                                <div>
                                                                    <div className="text-[13px] font-extrabold text-foreground uppercase tracking-tight">{med.name}</div>
                                                                    {med.brand && <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{med.brand}</div>}
                                                                </div>
                                                                <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-md">
                                                                    <PackagePlus size={17} strokeWidth={2.5} />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4">
                                        <Stethoscope size={150} />
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
                            className="bg-card w-full max-w-xl rounded-3xl shadow-pop border border-border overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/40">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-400 text-white rounded-xl flex items-center justify-center shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
                                        <UserPlus size={23} strokeWidth={2.3}/>
                                    </div>
                                    <h2 className="font-display text-xl font-extrabold text-foreground uppercase tracking-tight">Patient Registration</h2>
                                </div>
                                <button onClick={() => setIsAddingPatient(false)} className="w-10 h-10 flex items-center justify-center bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer">
                                    <X size={20} strokeWidth={2.6}/>
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreatePatient} className="p-7 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="label">Legal Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Full Name"
                                            value={newPatientForm.name}
                                            onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})}
                                            className="input" 
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Contact No *</label>
                                        <input 
                                            type="tel" 
                                            required
                                            placeholder="10-digit mobile"
                                            value={newPatientForm.phone}
                                            onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})}
                                            className="input" 
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="label">Referring Physician</label>
                                    <div className="relative group">
                                        <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={17} strokeWidth={2.2}/>
                                        <input 
                                            type="text" 
                                            placeholder="Dr. Name (Optional)"
                                            value={newPatientForm.doctorName}
                                            onChange={e => setNewPatientForm({...newPatientForm, doctorName: e.target.value})}
                                            className="input pl-10" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Physical Address</label>
                                    <textarea 
                                        placeholder="Full address for records..."
                                        rows={3}
                                        value={newPatientForm.address}
                                        onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})}
                                        className="input h-auto py-3 resize-none" 
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingPatient(false)}
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
