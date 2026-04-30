import type { HarNameValuePair, HarCookie } from '../types';

export function KVTable({ rows }: { rows: HarNameValuePair[] }) {
  if (rows.length === 0) return <div className="kv-empty">（无数据）</div>;
  return (
    <table className="kv-table">
      <thead><tr><th>Name</th><th>Value</th></tr></thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td className="kv-name">{row.name}</td>
            <td className="kv-value">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CookieTable({ cookies }: { cookies: HarCookie[] }) {
  if (cookies.length === 0) return <div className="kv-empty">（无 Cookie）</div>;
  return (
    <table className="kv-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
          <th>Domain</th>
          <th>Path</th>
          <th>Flags</th>
        </tr>
      </thead>
      <tbody>
        {cookies.map((c, i) => (
          <tr key={i}>
            <td className="kv-name">{c.name}</td>
            <td className="kv-value">{c.value}</td>
            <td className="kv-value">{c.domain ?? '—'}</td>
            <td className="kv-value">{c.path ?? '—'}</td>
            <td className="kv-value cookie-flags">
              {c.httpOnly && <span className="cookie-flag">HttpOnly</span>}
              {c.secure && <span className="cookie-flag">Secure</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
