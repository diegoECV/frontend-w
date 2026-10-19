// =============================================================================
// PLACEHOLDER GENÉRICO PARA PANELES EN CONSTRUCCIÓN — VISONS S.A.C.
// =============================================================================

import { useOutletContext } from 'react-router-dom';
import { Construction } from 'lucide-react';
import type { ReactNode } from 'react';

type OutletCtx = { lang: 'es' | 'en' };

interface PanelPlaceholderProps {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  icon: ReactNode;
  accentColor: string;
  accentBg: string;
}

export function PanelPlaceholder({
  titleEs, titleEn, descEs, descEn, icon, accentColor, accentBg,
}: PanelPlaceholderProps) {
  const { lang } = useOutletContext<OutletCtx>();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
      <div
        className={`w-20 h-20 rounded-3xl ${accentBg} border flex items-center justify-center shadow-xl`}
        style={{ color: accentColor, borderColor: `${accentColor}30` }}
      >
        {icon}
      </div>
      <div className="space-y-2">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
          style={{ color: accentColor, borderColor: `${accentColor}40`, background: `${accentColor}12` }}
        >
          {lang === 'es' ? 'En construcción' : 'Under construction'}
        </span>
        <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
          {lang === 'es' ? titleEs : titleEn}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {lang === 'es' ? descEs : descEn}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--text-hint)]">
        <Construction size={14} />
        <span>{lang === 'es' ? 'Este panel se construirá paso a paso.' : 'This panel will be built step by step.'}</span>
      </div>
    </div>
  );
}
