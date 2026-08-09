'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/components/theme-provider';
import { cn } from '@/src/lib/utils';

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'transition-all duration-200 cursor-pointer',
        showLabel
          ? 'w-full flex items-center gap-3 rounded-xl text-[13.5px] font-bold text-muted-foreground hover:bg-accent/70 hover:text-foreground px-3 py-2.5'
          : 'p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl border border-border flex items-center justify-center'
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 shrink-0" strokeWidth={2.4} />
      ) : (
        <Moon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
      )}
      {showLabel && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
}
