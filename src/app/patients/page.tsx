"use client";

import { useEffect, useState } from "react";
import { Users, Search, PackagePlus, Trash2, Edit, Phone, MapPin, Activity, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";

export default function PatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [medSearch, setMedSearch] = useState("");
    const [medResults, setMedResults] = useState<any[]>([]);

    // Add Patient State
    const [isAddingPatient, setIsAddingPatient] = useState(false);
    const [newPatientForm, setNewPatientForm] = useState({ name: "", phone: "", doctorName: "", address: "" });

    useEffect(() => {
        fetchPatients();
    }, [search]);

    const fetchPatients = async () => {
        try {
            const data = await apiClient.get(`/api/patients?search=${search}`);
            setPatients(data || []);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPatientForm.name || !newPatientForm.phone) {
            return alert("Name and Phone are required.");
        }
        
        try {
            await apiClient.post("/api/patients", newPatientForm);
            setIsAddingPatient(false);
            setNewPatientForm({ name: "", phone: "", doctorName: "", address: "" });
            fetchPatients();
        } catch (err) {
            alert("Failed to create patient. Phone number might already exist.");
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
                // Fetch from local inventory so the IDs match what the billing system expects
                const res = await apiClient.get(`/api/inventory?q=${medSearch}`);
                
                const uniqueMeds = new Map();
                for (const item of (res || [])) {
                    if (!uniqueMeds.has(item.medicineId)) {
                        uniqueMeds.set(item.medicineId, {
                            _id: item.medicineId, // The true Master Medicine ID
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
        if (existing) return alert("Medicine already in list!");

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
            fetchPatients(); // Refresh list
        } catch (err) {
            alert("Failed to update prescription");
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
            alert("Failed to delete medicine");
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Patient CRM</h2>
                    <p className="text-sm text-muted-foreground">Manage customer profiles and regular prescriptions.</p>
                </div>
                <button 
                    onClick={() => setIsAddingPatient(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Add New Patient
                </button>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-secondary/50 border border-border px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                </div>

                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading Patients...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {patients.map(patient => (
                            <button
                                key={patient._id}
                                onClick={() => setSelectedPatient(patient)}
                                className="p-4 rounded-xl border border-border bg-background hover:bg-accent/5 transition-all text-left flex flex-col gap-3 group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{patient.name}</h3>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                            <Phone size={14} />
                                            {patient.phone}
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold">
                                        ₹{patient.totalSpent.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                    <span className="flex items-center gap-1"><Activity size={12}/> {patient.regularMedicines?.length || 0} Prescriptions</span>
                                    {patient.doctorName && <span className="truncate">Dr. {patient.doctorName}</span>}
                                </div>
                            </button>
                        ))}
                        {patients.length === 0 && (
                            <div className="col-span-full text-center py-10 text-muted-foreground">
                                No patients found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Patient Detail Modal */}
            <AnimatePresence>
                {selectedPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-start bg-secondary/30">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{selectedPatient.name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><Phone size={14}/> {selectedPatient.phone}</span>
                                        {selectedPatient.address && <span className="flex items-center gap-1"><MapPin size={14}/> {selectedPatient.address}</span>}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X size={20} className="text-muted-foreground"/>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                                    <Activity size={18} className="text-indigo-500" />
                                    Active Prescriptions (Regular Buying)
                                </h3>

                                <div className="space-y-3 mb-6">
                                    {selectedPatient.regularMedicines?.map((med: any) => (
                                        <div key={med.medicineId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                                            <div className="font-medium text-foreground">{med.name}</div>
                                            <button 
                                                onClick={() => removeRegularMedicine(med.medicineId)}
                                                className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-md transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedPatient.regularMedicines || selectedPatient.regularMedicines.length === 0) && (
                                        <div className="text-sm text-muted-foreground italic text-center py-4 bg-secondary/20 rounded-lg border border-dashed border-border">
                                            No active prescriptions added yet.
                                        </div>
                                    )}
                                </div>

                                <div className="bg-secondary/20 p-5 border-t border-border mt-auto">
                                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
                                        <Search size={16} className="text-primary" />
                                        Search & Add Medicine
                                    </h4>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Type to search your inventory..."
                                            value={medSearch}
                                            onChange={(e) => setMedSearch(e.target.value)}
                                            className="w-full bg-background border border-border px-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm text-foreground shadow-sm placeholder:text-muted-foreground"
                                        />
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        
                                        <AnimatePresence>
                                            {medResults.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute bottom-full mb-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto"
                                                >
                                                    {medResults.map((med, idx) => (
                                                        <motion.button
                                                            key={med._id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            onClick={() => addRegularMedicine(med)}
                                                            className="w-full text-left p-3 hover:bg-muted/50 border-b border-border last:border-0 flex justify-between items-center group transition-colors"
                                                        >
                                                            <div>
                                                                <div className="font-semibold text-foreground text-sm">{med.name}</div>
                                                                {med.brand && <div className="text-xs text-muted-foreground mt-0.5">{med.brand}</div>}
                                                            </div>
                                                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                                                <PackagePlus size={16} />
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-2 text-center">
                                        Added medicines will automatically appear when you bill this patient.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add New Patient Modal */}
            <AnimatePresence>
                {isAddingPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
                                <h2 className="text-xl font-bold text-foreground">Add New Patient</h2>
                                <button onClick={() => setIsAddingPatient(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X size={20} className="text-muted-foreground"/>
                                </button>
                            </div>
                            <form onSubmit={handleCreatePatient} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. John Doe"
                                        value={newPatientForm.name}
                                        onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})}
                                        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
                                    <input 
                                        type="tel" 
                                        required
                                        placeholder="10-digit mobile number"
                                        value={newPatientForm.phone}
                                        onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})}
                                        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Doctor Name (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Dr. Smith"
                                        value={newPatientForm.doctorName}
                                        onChange={e => setNewPatientForm({...newPatientForm, doctorName: e.target.value})}
                                        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Address (Optional)</label>
                                    <textarea 
                                        placeholder="Patient's address..."
                                        rows={2}
                                        value={newPatientForm.address}
                                        onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})}
                                        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingPatient(false)}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-muted font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                                    >
                                        Create Patient
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
