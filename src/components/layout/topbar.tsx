
"use client";

import { ThemeToggle } from "@/src/components/theme-toggle";
import { Search, Bell, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export const Topbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        fetch(`/api/inventory?q=${searchQuery}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data);
            setShowResults(true);
          })
          .catch(err => console.error(err));
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.group')) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMedicine = (id: string) => {
    setSearchQuery("");
    setShowResults(false);
    router.push(`/billing?add=${id}`);
  };
  
  // Simple mapping for page titles
  const getPageTitle = (path: string) => {
    if (path === "/") return "Dashboard";
    const segment = path.split("/")[1];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ") : "Dashboard";
  };

  return (
    <div className="h-16 flex items-center justify-between px-6 bg-background border-b border-border sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {getPageTitle(pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative group">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search medicines..." 
            className="pl-10 pr-4 py-2 w-64 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all text-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchResults.length > 0) setShowResults(true); }}
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              <div className="p-2">
                {searchResults.map((med) => (
                  <button
                    key={med._id}
                    onClick={() => handleSelectMedicine(med._id)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 rounded-lg text-left transition-colors group/item"
                  >
                    <div>
                      <div className="font-medium text-foreground text-sm">{med.name}</div>
                      {med.composition && (
                        <div className="text-[11px] text-muted-foreground italic truncate">{med.composition}</div>
                      )}
                      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 mt-0.5">
                        <span>Stock: <span className={med.stock < 10 ? 'text-rose-500 font-medium' : ''}>{med.stock}</span></span>
                        <span>Rack: {med.rackNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <ThemeToggle />
        
        <div className="flex items-center gap-3 pl-2 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">Admin</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm ring-2 ring-background shadow-sm">
            AD
          </div>
        </div>
      </div>
    </div>
  );
};
