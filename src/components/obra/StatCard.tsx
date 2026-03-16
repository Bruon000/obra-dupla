import { formatCurrency } from '@/lib/formatters';

interface StatCardProps {
  label: string;
  value: number;
  variant?: 'default' | 'primary' | 'accent' | 'danger';
}

const variantStyles = {
  default: 'bg-card text-card-foreground',
  primary: 'bg-emerald-light text-primary',
  accent: 'bg-amber-light text-accent',
  danger: 'bg-destructive/10 text-destructive',
};

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 shadow-card border border-border ${variantStyles[variant]}`}>
      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-1">
        {label}
      </span>
      <span className="text-lg font-mono font-bold tracking-tight">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
