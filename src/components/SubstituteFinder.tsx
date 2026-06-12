"use client";

import { useState, useMemo } from "react";
import { Search, X, Pill, Package, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubstituteFinderProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: any[];
}

export default function SubstituteFinder({ isOpen, onClose, medicines }: SubstituteFinderProps) {
  const [search, setSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState<any | null>(null);

  // Filter medicines for autocomplete dropdown
  const searchResults = useMemo(() => {
    if (!search || selectedMed) return [];
    const q = search.toLowerCase();
    return medicines
      .filter((m) => m.name.toLowerCase().includes(q) || (m.barcode && m.barcode.includes(q)))
      .slice(0, 5); // Show top 5
  }, [search, medicines, selectedMed]);

  // Find substitutes based on composition
  const substitutes = useMemo(() => {
    if (!selectedMed || !selectedMed.composition) return [];
    const targetComp = selectedMed.composition.toLowerCase().trim();
    if (!targetComp) return [];
    
    return medicines
      .filter((m) => {
        if (m._id === selectedMed._id) return false; // Don't show the selected med itself
        if (!m.composition) return false;
        
        const mComp = m.composition.toLowerCase().trim();
        // Return if exact match, or if one includes the other (to catch things like 'Paracetamol' vs 'Paracetamol 500mg')
        return mComp === targetComp || mComp.includes(targetComp) || targetComp.includes(mComp);
      })
      .sort((a, b) => Number(b.stock) - Number(a.stock)); // Sort by highest stock first
  }, [selectedMed, medicines]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#11327c] to-[#1e4db7]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Activity className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Substitute Finder</h2>
                <p className="text-blue-100 text-xs font-medium">Instantly find alternative medicines by composition</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto">
            {/* Search Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                1. Select Requested Medicine
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Type medicine name (e.g. Dolo 650)..."
                  className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#11327c]/20 focus:bg-white transition-all text-gray-800"
                  value={selectedMed ? selectedMed.name : search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (selectedMed) setSelectedMed(null);
                  }}
                  autoFocus
                />
                {selectedMed && (
                  <button 
                    onClick={() => {
                      setSelectedMed(null);
                      setSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {!selectedMed && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20">
                  {searchResults.map((med) => (
                    <button
                      key={med._id}
                      onClick={() => setSelectedMed(med)}
                      className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-bold text-gray-800 text-[13px] group-hover:text-[#11327c] transition-colors">{med.name}</div>
                        <div className="text-[11px] text-gray-500 font-medium truncate max-w-[300px]">
                          {med.composition || "No composition"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] font-bold text-[#11327c]">₹{Number(med.sellingPrice).toFixed(2)}</div>
                        <div className={`text-[10px] font-bold ${Number(med.stock) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          Stock: {Math.floor(Number(med.stock || 0))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results Section */}
            {selectedMed && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 shrink-0 mt-0.5">
                    <Pill size={18} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-800">Target Composition</h3>
                    <p className="text-[12px] text-gray-600 font-medium mt-0.5 leading-relaxed">
                      {selectedMed.composition || <span className="text-rose-500 italic">No composition available for this medicine</span>}
                    </p>
                  </div>
                </div>

                {selectedMed.composition && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                        2. Available Substitutes ({substitutes.length})
                      </label>
                    </div>
                    
                    {substitutes.length === 0 ? (
                      <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                        <Package className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-[13px] font-bold text-gray-600">No substitutes found</p>
                        <p className="text-[12px] text-gray-400 mt-1 font-medium">We couldn't find any other medicines with this composition.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {substitutes.map((sub) => (
                          <div key={sub._id} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:border-blue-200 transition-colors bg-white shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <span className="text-emerald-600 font-bold text-[14px]">
                                  {sub.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-[14px]">{sub.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {sub.category || "Tablet"}
                                  </span>
                                  <span className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]">
                                    {sub.brand}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <span className="font-bold text-[#11327c] text-[15px]">₹{Number(sub.sellingPrice).toFixed(2)}</span>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                Number(sub.stock) > 10 ? 'bg-emerald-50 text-emerald-600' : 
                                Number(sub.stock) > 0 ? 'bg-amber-50 text-amber-600' : 
                                'bg-rose-50 text-rose-600'
                              }`}>
                                Stock: {Math.floor(Number(sub.stock || 0))} {sub.pack || "Units"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
