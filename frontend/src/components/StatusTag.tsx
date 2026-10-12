import type { ReactNode } from 'react';

export function StatusTag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'demo' | 'good' | 'warn' | 'bad' | 'cyan' }) {
  return <span className={`status-tag status-tag--${tone}`}><span aria-hidden="true" className="status-dot" />{children}</span>;
}

export function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return <div className="section-label"><span>{index}</span><span>{children}</span></div>;
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="mono">{children}</span>;
}
