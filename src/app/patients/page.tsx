"use client";

import { useEffect, useState } from "react";
import { Users, Search, PackagePlus, Trash2, Edit, Phone, MapPin, Activity, X, Plus, UserPlus, CreditCard, Stethoscope, ChevronRight, Loader2, CheckCircle2 } from "@/src/components/icons";
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
    // Edit patient state
    const [isEditingPatient, setIsEditingPatient] = useState(false);
    const [editPatientForm, setEditPatientForm] = useState({ name: "", phone: "", address: "", doctorName: "" });
    const [isSavingPatient, setIsSavingPatient] = useState(false);
    const [editError, setEditError] = useState("");

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

    // Sync edit form when modal opens / patient changes
    useEffect(() => {
        if (selectedPatient) {
            setEditPatientForm({
                name: selectedPatient.name || "",
                phone: selectedPatient.phone || "",
                address: selectedPatient.address || "",
                doctorName: selectedPatient.doctorName || "",
            });
            setIsEditingPatient(false);
            setEditError("");
        }
    }, [selectedPatient?._id]);

    const handleUpdatePatient = async () => {
        if (!selectedPatient) return;
        if (!editPatientForm.name.trim() || !editPatientForm.phone.trim()) {
            setEditError("Name and phone are required");
            return;
        }
        setIsSavingPatient(true);
        setEditError("");
        try {
            const updated = await apiClient.put("/api/patients", {
                _id: selectedPatient._id,
                name: editPatientForm.name.trim(),
                phone: editPatientForm.phone.trim(),
                address: editPatientForm.address.trim(),
                doctorName: editPatientForm.doctorName.trim(),
            });
            setSelectedPatient(updated);
            fetchPatients();
            setIsEditingPatient(false);
        } catch (err: any) {
            setEditError(err?.message || "Failed to update patient");
        } finally {
            setIsSavingPatient(false);
        }
    };

    const handleDeletePatient = async (e: React.MouseEvent, patient: any) => {
        e.stopPropagation();
        if (!window.confirm(`Delete patient "${patient.name}" (${patient.phone})? This cannot be undone.`)) return;
        try {
            await apiClient.delete(`/api/patients?id=${patient._id}`);
            if (selectedPatient?._id === patient._id) setSelectedPatient(null);
            fetchPatients();
        } catch (err: any) {
            alert(err?.message || "Failed to delete patient");
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
                                <motion.div
                                    key={patient._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => setSelectedPatient(patient)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedPatient(patient); } }}
                                    className="group relative p-4 rounded-2xl border border-border bg-card hover:border-primary/25 transition-all text-left flex items-center justify-between gap-5 hover:shadow-lift active:scale-[0.99] w-full cursor-pointer"
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

                                    <div className="flex items-center justify-center border-l border-r border-border/60 px-6 w-1/3 min-w-[200px]">
                                        <div className="flex items-center gap-2 text-[12px] text-muted-foreground truncate max-w-[260px]">
                                            <MapPin size={14} className="text-primary shrink-0" />
                                            <span className="truncate" title={patient.address || ""}>{patient.address?.trim() ? patient.address : "No address"}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center gap-3 w-1/3 min-w-[150px]">
                                        <div className="flex flex-col items-end">
                                            <div className="bg-success/12 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest ring-1 ring-inset ring-success/25">
                                                ₹{patient.totalSpent.toLocaleString()}
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Lifetime Value</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeletePatient(e, patient)}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all shrink-0"
                                            title={`Delete ${patient.name}`}
                                            aria-label={`Delete ${patient.name}`}
                                        >
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                        <ChevronRight size={18} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" strokeWidth={3} />
                                    </div>
                                </motion.div>
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
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ type: "spring", stiffness: 360, damping: 26 }}
                            className="bg-card w-full max-w-xl rounded-xl shadow-pop border border-border overflow-hidden"
                        >
                            {/* Modal Header — view / edit */}
                            <div className="p-7 border-b border-border bg-muted/40">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex gap-5 flex-1 min-w-0">
                                        <div className="w-16 h-16 bg-gradient-to-br from-[#11327c] to-[#1e58b8] text-white rounded-2xl flex items-center justify-center shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-6px_rgb(15_23_42/0.5)] shrink-0">
                                            <Users size={30} strokeWidth={2.3} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {!isEditingPatient ? (
                                                <>
                                                    <h2 className="font-display text-2xl font-extrabold text-foreground uppercase tracking-tight truncate">{selectedPatient.name}</h2>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em]">
                                                        <span className="flex items-center gap-2"><Phone size={14} className="text-amber-500" /> {selectedPatient.phone}</span>
                                                        {selectedPatient.address && <span className="flex items-center gap-2 truncate"><MapPin size={14} className="text-primary" /> {selectedPatient.address}</span>}
                                                        <span className="badge-success"><CreditCard size={13} /> ₹{selectedPatient.totalSpent.toLocaleString()} Spent</span>
                                                    </div>
                                                    {selectedPatient.doctorName && <div className="mt-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Stethoscope size={14} className="text-rose-400" /> Dr. {selectedPatient.doctorName}</div>}
                                                </>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="label">Patient Name *</label>
                                                            <input value={editPatientForm.name} onChange={(e)=>setEditPatientForm({...editPatientForm, name:e.target.value})} className="input" placeholder="Full Name" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Phone *</label>
                                                            <input value={editPatientForm.phone} onChange={(e)=>setEditPatientForm({...editPatientForm, phone:e.target.value})} className="input" placeholder="10-digit" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="label">Address</label>
                                                        <input value={editPatientForm.address} onChange={(e)=>setEditPatientForm({...editPatientForm, address:e.target.value})} className="input" placeholder="Full address" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Doctor</label>
                                                        <input value={editPatientForm.doctorName} onChange={(e)=>setEditPatientForm({...editPatientForm, doctorName:e.target.value})} className="input" placeholder="Dr. Name" />
                                                    </div>
                                                    {editError && <div className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{editError}</div>}
                                                    <div className="flex gap-2">
                                                        <button onClick={()=>{ setIsEditingPatient(false); setEditError(""); }} disabled={isSavingPatient} className="btn-outline btn-sm flex-1">Cancel</button>
                                                        <button onClick={handleUpdatePatient} disabled={isSavingPatient} className="btn-primary btn-sm flex-1">{isSavingPatient ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2} />} Save Changes</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!isEditingPatient && (
                                            <button onClick={()=>setIsEditingPatient(true)} className="w-10 h-10 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 rounded-xl transition-all" title="Edit patient">
                                                <Edit size={18} strokeWidth={2} />
                                            </button>
                                        )}
                                        <button onClick={() => setSelectedPatient(null)} className="w-10 h-10 flex items-center justify-center bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 rounded-xl transition-all active:scale-90 cursor-pointer">
                                            <X size={20} strokeWidth={2.6}/>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Content — simplified (Regular Prescriptions removed) */}
                            <div className="p-7">
                                <div className="rounded-xl border border-border bg-muted/40 p-4 flex gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <Stethoscope size={16} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-medium text-foreground">Patient record</p>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
                                            This patient’s <span className="font-medium text-foreground">name, phone and address</span> are used for billing auto-fill.
                                            Keep them up to date via <span className="font-medium text-foreground">Edit</span> — billing will always show the latest saved values.
                                        </p>
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
