import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Illustration = "patients" | "reports" | "templates";

interface EmptyStateProps {
  illustration?: Illustration;
  title: string;
  description?: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
}

const Illustrations: Record<Illustration, ReactNode> = {
  patients: (
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-label="Ilustração: nenhum paciente"
      className="h-32 w-auto"
    >
      <defs>
        <linearGradient id="ill-p-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(217 100% 96%)" />
          <stop offset="100%" stopColor="hsl(217 100% 92%)" />
        </linearGradient>
      </defs>
      <rect x="10" y="105" width="180" height="10" rx="5" fill="url(#ill-p-bg)" />
      <rect x="40" y="40" width="120" height="65" rx="10" fill="#fff" stroke="hsl(217 32% 88%)" />
      <circle cx="70" cy="68" r="13" fill="hsl(217 100% 95%)" stroke="hsl(217 100% 50%)" strokeWidth="1.5" />
      <path d="M55 95 q15 -16 30 0" fill="none" stroke="hsl(217 100% 50%)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="98" y="60" width="50" height="6" rx="3" fill="hsl(217 32% 90%)" />
      <rect x="98" y="74" width="36" height="6" rx="3" fill="hsl(217 32% 94%)" />
      <circle cx="150" cy="40" r="14" fill="hsl(160 84% 39%)" />
      <path d="M150 34 v12 M144 40 h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  reports: (
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-label="Ilustração: nenhum laudo"
      className="h-32 w-auto"
    >
      <rect x="10" y="105" width="180" height="10" rx="5" fill="hsl(217 100% 95%)" />
      <rect x="55" y="22" width="90" height="92" rx="8" fill="#fff" stroke="hsl(217 32% 88%)" />
      <rect x="65" y="35" width="55" height="6" rx="3" fill="hsl(217 100% 50%)" />
      <rect x="65" y="50" width="70" height="4" rx="2" fill="hsl(217 32% 92%)" />
      <rect x="65" y="60" width="60" height="4" rx="2" fill="hsl(217 32% 92%)" />
      <rect x="65" y="70" width="68" height="4" rx="2" fill="hsl(217 32% 92%)" />
      <rect x="65" y="84" width="40" height="4" rx="2" fill="hsl(217 32% 94%)" />
      <rect x="65" y="93" width="50" height="4" rx="2" fill="hsl(217 32% 94%)" />
      <circle cx="148" cy="38" r="13" fill="hsl(160 84% 39%)" />
      <path d="M142 38 l5 5 l8 -10" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  templates: (
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-label="Ilustração: nenhum modelo"
      className="h-32 w-auto"
    >
      <rect x="10" y="105" width="180" height="10" rx="5" fill="hsl(217 100% 95%)" />
      <rect x="40" y="38" width="64" height="76" rx="8" fill="hsl(217 100% 96%)" stroke="hsl(217 100% 50%)" strokeOpacity="0.35" />
      <rect x="68" y="28" width="64" height="76" rx="8" fill="#fff" stroke="hsl(217 32% 88%)" />
      <rect x="96" y="20" width="64" height="76" rx="8" fill="#fff" stroke="hsl(217 32% 88%)" />
      <rect x="104" y="34" width="40" height="6" rx="3" fill="hsl(217 100% 50%)" />
      <rect x="104" y="46" width="48" height="4" rx="2" fill="hsl(217 32% 92%)" />
      <rect x="104" y="56" width="44" height="4" rx="2" fill="hsl(217 32% 92%)" />
      <rect x="104" y="66" width="36" height="4" rx="2" fill="hsl(217 32% 92%)" />
      <rect x="104" y="80" width="28" height="6" rx="3" fill="hsl(160 84% 39%)" />
    </svg>
  ),
};

export default function EmptyState({
  illustration = "reports",
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  const button = action ? (
    action.to ? (
      <Link
        to={action.to}
        aria-label={action.label}
        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-10 px-5 rounded-lg shadow-primary hover-lift"
      >
        {action.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={action.onClick}
        aria-label={action.label}
        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-10 px-5 rounded-lg shadow-primary hover-lift"
      >
        {action.label}
      </button>
    )
  ) : null;

  return (
    <div className="bg-white rounded-xl border border-dashed border-border p-10 text-center animate-fade-in">
      <div className="mx-auto mb-4 flex justify-center">
        {Illustrations[illustration]}
      </div>
      <h3 className="font-sans font-semibold text-foreground text-base">{title}</h3>
      {description && (
        <p className="mt-1 font-body text-sm text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
      )}
      {(button || children) && (
        <div className="mt-5 flex justify-center">{button ?? children}</div>
      )}
    </div>
  );
}
