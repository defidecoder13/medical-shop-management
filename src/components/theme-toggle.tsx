'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/components/theme-provider';

import { Button } from './ui/button';

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={showLabel 
        ? "w-full flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-[13.5px] font-bold transition-colors"
        : "p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center"
      }
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-yellow-400 shrink-0" strokeWidth={2.5} />
      ) : (
        <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400 shrink-0" strokeWidth={2.5} />
      )}
      {showLabel && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
}