import { useState } from 'react';
import type { ParsedEntry } from '../types';

interface Props {
  entries: ParsedEntry[];
  selectedId: string | null;
  onSelect: (entry: ParsedEntry) => void;
}

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return '#61affe';
    case 'POST': return '#49cc90';
    case 'PUT': return '#fca130';
    case 'DELETE': return '#f93e3e';
    case 'PATCH': return '#50e3c2';
    default: return '#999';
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
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? entries.filter(
        (e) =>
          e.url.toLowerCase().includes(filter.toLowerCase()) ||
          e.method.toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  return (
    <div className="entry-list">
      <div className="entry-list-header">
        <input
          className="entry-filter"
          type="text"
          placeholder="过滤请求..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="entry-count">{filtered.length}/{entries.length}</span>
      </div>
      <div className="entry-list-body">
        {filtered.map((entry) => (
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
