import type { ParsedEntry, HarTimings } from '../types';

interface Props {
  entry: ParsedEntry;
}

function formatBytes(bytes: number): string {
  if (bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

interface TimingPhase {
  key: keyof HarTimings;
  label: string;
  color: string;
}

const PHASES: TimingPhase[] = [
  { key: 'blocked', label: 'Blocked',  color: '#94a3b8' },
  { key: 'dns',     label: 'DNS',      color: '#60a5fa' },
  { key: 'connect', label: 'Connect',  color: '#34d399' },
  { key: 'ssl',     label: 'SSL',      color: '#f59e0b' },
  { key: 'send',    label: 'Send',     color: '#a78bfa' },
  { key: 'wait',    label: 'TTFB',     color: '#f87171' },
  { key: 'receive', label: 'Download', color: '#2dd4bf' },
];

function TimingBar({ timings }: { timings: HarTimings }) {
  const phases = PHASES.map(p => ({
    ...p,
    ms: Math.max(0, timings[p.key] ?? 0),
  })).filter(p => p.ms > 0);

  const total = phases.reduce((s, p) => s + p.ms, 0);
  if (total === 0) return <div className="kv-empty">无时序数据</div>;

  return (
    <div className="timing-section">
      {/* stacked bar */}
      <div className="timing-bar">
        {phases.map(p => (
          <div
            key={p.key}
            className="timing-bar-seg"
            style={{ width: `${(p.ms / total) * 100}%`, background: p.color }}
            title={`${p.label}: ${p.ms.toFixed(1)}ms`}
          />
        ))}
      </div>
      {/* rows */}
      <div className="timing-rows">
        {phases.map(p => (
          <div key={p.key} className={`timing-row ${p.key === 'wait' ? 'timing-ttfb' : ''}`}>
            <span className="timing-dot" style={{ background: p.color }} />
            <span className="timing-label">{p.label}</span>
            <div className="timing-track">
              <div
                className="timing-fill"
                style={{ width: `${(p.ms / total) * 100}%`, background: p.color }}
              />
            </div>
            <span className="timing-ms">{p.ms.toFixed(1)} ms</span>
          </div>
        ))}
        <div className="timing-row timing-total">
          <span className="timing-dot" style={{ background: 'transparent' }} />
          <span className="timing-label">Total</span>
          <div className="timing-track" />
          <span className="timing-ms">{total.toFixed(1)} ms</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overview-section">
      <div className="overview-section-title">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, mono, copyable }: { label: string; value: string; mono?: boolean; copyable?: boolean }) {
  return (
    <div className="overview-row">
      <span className="overview-label">{label}</span>
      <span className={`overview-value ${mono ? 'mono' : ''}`}>
        {value}
        {copyable && (
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(value)}
            title="复制"
          >
            ⎘
          </button>
        )}
      </span>
    </div>
  );
}

export function OverviewPanel({ entry }: Props) {
  const statusColor = entry.status >= 200 && entry.status < 300 ? '#16a34a'
    : entry.status >= 400 ? '#dc2626' : '#d97706';

  return (
    <div className="overview-panel kv-scroll">
      <Section title="General">
        <Row label="URL" value={entry.url} mono copyable />
        <Row label="Method" value={entry.method} />
        <Row label="Protocol" value={entry.httpVersion} />
        <div className="overview-row">
          <span className="overview-label">Status</span>
          <span className="overview-value">
            <span style={{ color: statusColor, fontWeight: 600 }}>{entry.status}</span>
            {entry.statusText && <span className="overview-status-text"> {entry.statusText}</span>}
          </span>
        </div>
        <Row label="Started" value={formatDate(entry.startedDateTime)} />
      </Section>

      <Section title="Size">
        <Row label="Request Body" value={formatBytes(entry.requestBodySize)} />
        <Row label="Response Body" value={formatBytes(entry.responseBodySize)} />
        <Row label="Transferred" value={formatBytes(entry.responseTransferSize)} />
        <Row label="MIME Type" value={entry.responseMimeType || '—'} mono />
      </Section>

      <Section title="Timing">
        <TimingBar timings={entry.timings} />
      </Section>
    </div>
  );
}
