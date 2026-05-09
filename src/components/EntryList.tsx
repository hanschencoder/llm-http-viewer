import type { ParsedEntry } from '../types';

interface Props {
  entries: ParsedEntry[];
  selectedId: string | null;
  onSelect: (entry: ParsedEntry) => void;
}

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return 'var(--color-method-get)';
    case 'POST': return 'var(--color-method-post)';
    case 'PUT': return 'var(--color-method-put)';
    case 'DELETE': return 'var(--color-method-delete)';
    case 'PATCH': return 'var(--color-method-patch)';
    default: return 'var(--color-text-muted)';
  }
}

function statusClass(status: number): string {
  if (status >= 200 && status < 300) return 'status-success';
  if (status >= 300 && status < 400) return 'status-warning';
  if (status >= 400) return 'status-danger';
  return 'status-muted';
}

function splitUrl(url: string): { host: string; path: string } {
  try {
    const u = new URL(url);
    return { host: u.host, path: (u.pathname + u.search) || '/' };
  } catch {
    return { host: '', path: url };
  }
}

function truncate(text: string, maxLen = 64): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '\u2026' : text;
}

export function EntryList({ entries, selectedId, onSelect }: Props) {
  return (
    <div className="entry-list">
      <div className="entry-list-body">
        {entries.map((entry) => {
          const { host, path } = splitUrl(entry.url);
          return (
            <div
              key={entry.id}
              className={`entry-item ${entry.id === selectedId ? 'selected' : ''}`}
              onClick={() => onSelect(entry)}
            >
              <span className="method-badge" style={{ background: methodColor(entry.method) }}>
                {entry.method}
              </span>
              <span className="entry-url" title={entry.url}>
                {truncate(path)}
              </span>
              <span className={`status-badge ${statusClass(entry.status)}`}>
                {entry.status}
              </span>
              <div className="entry-meta">
                {host && <span className="entry-meta-host" title={host}>{host}</span>}
                <span className="entry-meta-dot">·</span>
                <span className="entry-time">{Math.round(entry.time)} ms</span>
                {entry.isStreaming && (
                  <>
                    <span className="entry-meta-dot">·</span>
                    <span className="stream-badge" title="流式响应">SSE</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
