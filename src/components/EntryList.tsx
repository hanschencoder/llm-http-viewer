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

function truncateUrl(url: string, maxLen = 60): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path.length > maxLen ? path.slice(0, maxLen) + '...' : path;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '...' : url;
  }
}

export function EntryList({ entries, selectedId, onSelect }: Props) {
  return (
    <div className="entry-list">
      <div className="entry-list-body">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`entry-item ${entry.id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(entry)}
          >
            <span className="method-badge" style={{ background: methodColor(entry.method) }}>
              {entry.method}
            </span>
            <span className="entry-url" title={entry.url}>
              {truncateUrl(entry.url)}
            </span>
            <span className={`status-badge ${statusClass(entry.status)}`}>
              {entry.status}
            </span>
            {entry.isStreaming && <span className="stream-badge" title="流式响应">流</span>}
            <span className="entry-time">{Math.round(entry.time)}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}
