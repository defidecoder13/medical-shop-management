import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9.5 w-full rounded-full border border-border bg-card px-4 text-sm text-foreground shadow-xs transition-all placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-[#397F7C] focus-visible:ring-2 focus-visible:ring-[#397F7C]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
