import { formatCurrency } from '@/lib/formatters';

interface StatCardProps {
  label: string;
  value: number;
  variant?: 'default' | 'primary' | 'accent' | 'danger';
}

const variantStyles = {
  default: 'bg-card/60 text-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-3 shadow-card border border-border ${variantStyles[variant]}`}>
      <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block mb-1.5">
        {label}
      </span>
      <span className="text-lg font-mono font-extrabold tracking-tight">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
