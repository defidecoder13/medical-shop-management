"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Save, Package, CheckCircle2, AlertCircle, X, Server } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";
import { Topbar } from "@/src/components/layout/topbar";

export default function RackAssignmentPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rackNumber, setRackNumber] = useState("");
  const [search, setSearch] = useState("");
  
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      // Fetch all medicines. We don't need pagination for this specific search tool, but we'll limit to a large number if needed.
      const handlePayload = (payload: any) => {
        if (!payload) return;
        if (payload.data && Array.isArray(payload.data)) {
          setMedicines(payload.data);
        } else if (Array.isArray(payload)) {
          setMedicines(payload);
        }
      };

      const res = await apiClient.get('/api/inventory?page=1&limit=5000', {}, handlePayload);
      handlePayload(res);
    } catch (error) {
      console.error("Failed to load medicines", error);
      setMessage({ text: "Failed to load medicines.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return medicines
      .filter(m => 
        (m.name?.toLowerCase().includes(q) || m.barcode?.toLowerCase().includes(q)) && 
        !selectedMeds.some(sel => sel._id === m._id) // Don't show already selected
      )
      .slice(0, 8); // Show top 8
  }, [search, medicines, selectedMeds]);

  const handleAddMedicine = (med: any) => {
    setSelectedMeds(prev => [...prev, med]);
    setSearch("");
  };

  const handleRemoveMedicine = (id: string) => {
    setSelectedMeds(prev => prev.filter(m => m._id !== id));
  };

  const handleSave = async () => {
    if (!rackNumber.trim()) {
      setMessage({ text: "Please enter a Rack Number.", type: "error" });
      return;
    }
    if (selectedMeds.length === 0) {
      setMessage({ text: "Please select at least one medicine.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const medicineIds = selectedMeds.map(m => m._id);

      const res = await apiClient.put('/api/inventory/bulk-rack', {
        rackNumber,
        medicineIds
      });

      if (res.success) {
        setMessage({ text: res.message || "Rack numbers updated successfully!", type: "success" });
        setSelectedMeds([]);
        setRackNumber("");
        // Refresh medicines to get the updated data
        fetchMedicines();
      } else {
        setMessage({ text: res.error || "Failed to update.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 h-screen flex flex-col">
      <Topbar />

      <div className="p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Server className="text-blue-600" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Bulk Rack Assignment</h1>
              <p className="text-sm font-medium text-gray-500">Assign a single rack number to multiple medicines at once.</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-bold ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side: Setup */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">1. Target Rack Number</label>
                <input
                  type="text"
                  placeholder="e.g., A-12, Shelf 3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={rackNumber}
                  onChange={(e) => setRackNumber(e.target.value)}
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">2. Search & Add Medicines</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder="Type medicine name..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Autocomplete Results */}
                {search.trim() && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20">
                    {searchResults.map((med) => (
                      <button
                        key={med._id}
                        onClick={() => handleAddMedicine(med)}
                        className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition-colors flex justify-between items-center group"
                      >
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{med.name}</div>
                          <div className="text-xs text-gray-500 font-medium">{med.brand || "Generic"}</div>
                        </div>
                        <PlusIcon />
                      </button>
                    ))}
                  </div>
                )}
                {search.trim() && searchResults.length === 0 && !loading && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center z-20">
                    <p className="text-sm font-medium text-gray-500">No medicines found or already added.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Selected List */}
            <div className="flex flex-col flex-1 border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
              <div className="px-5 py-3 border-b border-gray-200 bg-white flex justify-between items-center">
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">3. Selected Medicines</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{selectedMeds.length} Items</span>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto max-h-[400px]">
                {selectedMeds.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10">
                    <Package size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">No medicines selected yet.<br/>Search and add them from the left.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedMeds.map((med) => (
                      <div key={med._id} className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <div className="font-bold text-sm text-gray-900">{med.name}</div>
                          <div className="text-xs text-gray-500 font-medium">{med.brand || "Generic"}</div>
                        </div>
                        <button 
                          onClick={() => handleRemoveMedicine(med._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <button
                  onClick={handleSave}
                  disabled={saving || selectedMeds.length === 0 || !rackNumber.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#11327c] text-white py-3.5 rounded-xl text-sm font-black shadow-md hover:bg-[#1e4db7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "SAVING..." : (
                    <>
                      <Save size={18} strokeWidth={2.5} />
                      SAVE ASSIGNMENT
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
