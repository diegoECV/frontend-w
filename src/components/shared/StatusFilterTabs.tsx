import React from 'react';
import { CheckCircle2, Trash2, Layers } from 'lucide-react';

export type FilterTrashStatus = 'active' | 'trash' | 'all';

interface StatusFilterTabsProps {
  current: FilterTrashStatus;
  onChange: (status: FilterTrashStatus) => void;
  counts: {
    active: number;
    trash: number;
    all?: number;
  };
  labels?: {
    active?: string;
    trash?: string;
    all?: string;
  };
  lang?: 'es' | 'en';
}

export const StatusFilterTabs: React.FC<StatusFilterTabsProps> = ({
  current,
  onChange,
  counts,
  labels,
  lang = 'es',
}) => {
  const activeLabel = labels?.active || (lang === 'es' ? 'Activos' : 'Active');
  const trashLabel = labels?.trash || (lang === 'es' ? 'Papelera / Eliminados' : 'Trash / Deleted');
  const allLabel = labels?.all || (lang === 'es' ? 'Todos' : 'All');

  const totalAll = counts.all ?? (counts.active + counts.trash);

  return (
    <div className="flex items-center p-1 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm gap-1">
      {/* 1. Activos */}
      <button
        type="button"
        onClick={() => onChange('active')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          current === 'active'
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
        }`}
      >
        <CheckCircle2 size={13} className={current === 'active' ? 'text-white' : 'text-emerald-500'} />
        <span>{activeLabel}</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
            current === 'active'
              ? 'bg-white/20 text-white'
              : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
          }`}
        >
          {counts.active}
        </span>
      </button>

      {/* 2. Papelera / Eliminados Lógicamente */}
      <button
        type="button"
        onClick={() => onChange('trash')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          current === 'trash'
            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
            : 'text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10'
        }`}
      >
        <Trash2 size={13} className={current === 'trash' ? 'text-white' : 'text-rose-500'} />
        <span>{trashLabel}</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
            current === 'trash'
              ? 'bg-white/20 text-white'
              : counts.trash > 0
              ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
              : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
          }`}
        >
          {counts.trash}
        </span>
      </button>

      {/* 3. Todos */}
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          current === 'all'
            ? 'bg-zinc-800 dark:bg-zinc-700 text-white shadow-md'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
        }`}
      >
        <Layers size={13} className={current === 'all' ? 'text-white' : 'text-[var(--text-secondary)]'} />
        <span>{allLabel}</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
            current === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
          }`}
        >
          {totalAll}
        </span>
      </button>
    </div>
  );
};
