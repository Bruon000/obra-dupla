import { formatCurrency } from '@/lib/formatters';
import type React from 'react';

type KpiVariant = 'neutral' | 'primary' | 'accent' | 'danger';
type KpiEmphasis = 'main' | 'secondary';

type KpiBackgroundImage = {
  src: string;
  /** Ex.: "center", "0% 50%", "50% 50%", "100% 50%" */
  position?: string;
  /** Ex.: "cover", "300% 100%" (para recorte horizontal) */
  size?: string;
  /** 0..1 */
  opacity?: number;
  /** CSS filter. Ex.: "none", "contrast(1.15) saturate(1.08)" */
  filter?: string;
};

const variantStyles: Record<KpiVariant, { container: string; value: string; topGlow: string }> = {
  neutral: {
    container: 'bg-card/70 border-border',
    value: 'text-foreground',
    topGlow: 'from-foreground/20 via-card/0 to-card/0',
  },
  primary: {
    container: 'bg-primary/10 border-primary/20',
    value: 'text-primary',
    topGlow: 'from-primary/90 via-primary/20 to-primary/0',
  },
  accent: {
    container: 'bg-accent/10 border-accent/20',
    value: 'text-accent',
    topGlow: 'from-accent/90 via-accent/20 to-accent/0',
  },
  danger: {
    container: 'bg-destructive/10 border-destructive/20',
    value: 'text-destructive',
    topGlow: 'from-destructive/90 via-destructive/20 to-destructive/0',
  },
};

export function KpiCard({
  label,
  value,
  variant = 'neutral',
  emphasis = 'secondary',
  subtitle,
  icon: Icon,
  backgroundImage,
  className = '',
}: {
  label: string;
  value: number;
  variant?: KpiVariant;
  emphasis?: KpiEmphasis;
  subtitle?: string;
  icon?: React.ElementType;
  backgroundImage?: KpiBackgroundImage;
  className?: string;
}) {
  const v = variantStyles[variant];
  const isMain = emphasis === 'main';
  const textureOpacity = backgroundImage?.src ? 'opacity-[0.08]' : 'opacity-[0.14]';
  const bottomFade = backgroundImage?.src ? 'to-card/75' : 'to-card/90';
  const iconBg =
    variant === 'primary'
      ? 'bg-primary/10 border-primary/25'
      : variant === 'accent'
        ? 'bg-accent/10 border-accent/25'
        : variant === 'danger'
          ? 'bg-destructive/10 border-destructive/25'
          : 'bg-card/55 border-border/60';

  return (
    <div
      className={[
        'relative border shadow-card overflow-hidden',
        isMain ? 'rounded-3xl' : 'rounded-2xl',
        'bg-card/70',
        v.container,
        className,
      ].join(' ')}
    >
      {/* Faixa superior minimalista (industrial, sem neon) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-border/70 via-border to-border/20" />
      {/* Imagem de fundo (opcional) — bem discreta */}
      {backgroundImage?.src ? (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${backgroundImage.src})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: backgroundImage.position ?? '50% 22%',
              backgroundSize: backgroundImage.size ?? 'cover',
              opacity: backgroundImage.opacity ?? 0.12,
              filter: backgroundImage.filter ?? 'grayscale(0.15) contrast(1.05)',
            }}
          />
          {/* Ajuda a “cortar” numeração embutida nas artes */}
          <div
            className={[
              'absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent',
              bottomFade,
            ].join(' ')}
          />
        </>
      ) : null}
      {/* Micro-textura blueprint/concreto (bem sutil) */}
      <div
        className={[
          'absolute inset-0',
          textureOpacity,
          'bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:28px_28px]',
        ].join(' ')}
      />
      {/* Marca d’água (imagem) — discreta e industrial */}
      {Icon ? (
        <div className="absolute right-3 bottom-3 pointer-events-none opacity-[0.07]">
          <Icon className={isMain ? 'h-20 w-20' : 'h-16 w-16'} />
        </div>
      ) : null}
      <div className="relative p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon ? (
                <span
                  className={[
                    'inline-flex h-8 w-8 items-center justify-center rounded-xl border',
                    iconBg,
                  ].join(' ')}
                >
                  <Icon className={`w-4 h-4 ${v.value}`} />
                </span>
              ) : (
                <span
                  className={[
                    'inline-flex rounded-full',
                    isMain ? 'h-2.5 w-2.5' : 'h-2 w-2',
                    'bg-gradient-to-br',
                    v.value,
                  ].join(' ')}
                />
              )}

              <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">
                {label}
              </div>
            </div>

            <div
              className={[
                'mt-2 font-mono font-extrabold tracking-tight',
                isMain ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl',
                v.value,
              ].join(' ')}
            >
              {formatCurrency(value)}
            </div>

            {subtitle ? (
              <div
                className={[
                  'mt-1 text-[10px] uppercase tracking-wider font-bold',
                  isMain ? 'text-muted-foreground/90' : 'text-muted-foreground/80',
                ].join(' ')}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

