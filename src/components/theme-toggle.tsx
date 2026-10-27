'use client';

import { Moon, Sun } from '@/src/components/icons';
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
        'transition-all duration-150 cursor-pointer',
        showLabel
          ? 'w-full flex items-center gap-2.5 rounded-full text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground px-3 py-2'
          : 'w-8.5 h-8.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full border border-border/80 flex items-center justify-center bg-card/50'
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 shrink-0" strokeWidth={2.2} />
      ) : (
        <Moon className="h-4 w-4 text-[#506867] shrink-0" strokeWidth={2.2} />
      )}
      {showLabel && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
}
