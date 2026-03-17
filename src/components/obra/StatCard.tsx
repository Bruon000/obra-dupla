import { formatCurrency } from '@/lib/formatters';

interface StatCardProps {
  label: string;
  value: number;
  variant?: 'default' | 'primary' | 'accent' | 'danger';
}

const variantStyles = {
  default: 'bg-card text-card-foreground',
  primary: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-amber-light text-accent border-accent/20',
  danger: 'bg-destructive/10 text-destructive',
};

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-lg p-3 shadow-card border border-border ${variantStyles[variant]}`}>
      <span className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground block mb-1">
        {label}
      </span>
      <span className="text-base font-mono font-extrabold tracking-tight">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
