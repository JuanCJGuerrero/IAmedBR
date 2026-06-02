import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "light" | "dark";

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  showWordmark?: boolean;
  className?: string;
}

const SYMBOL_SIZES: Record<LogoSize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const WORDMARK_SIZES: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

/**
 * IAmedBR — Logotipo
 * Símbolo: losango com cruz médica, traço primary sobre caixa branca arredondada.
 */
export function Logo({
  size = "md",
  variant = "light",
  showWordmark = true,
  className,
}: LogoProps) {
  const wordmarkColor = variant === "light" ? "text-foreground" : "text-white";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center bg-white p-1.5 rounded-lg shadow-sm",
          SYMBOL_SIZES[size],
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Losango (cubo isométrico simplificado) */}
          <path
            d="M16 3 L29 16 L16 29 L3 16 Z"
            stroke="hsl(var(--primary))"
            strokeWidth="2.25"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Cruz médica central */}
          <path
            d="M16 10.5 V21.5 M10.5 16 H21.5"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={cn(
            "font-sans font-bold tracking-tight leading-none",
            WORDMARK_SIZES[size],
            wordmarkColor,
          )}
        >
          IAmedBR
        </span>
      )}
    </div>
  );
}

export default Logo;
