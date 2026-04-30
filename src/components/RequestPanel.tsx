import { useState } from 'react';
import { JsonTreeView } from './JsonTreeView';
import { KVTable, CookieTable } from './KVTable';
import type { HarNameValuePair, HarCookie } from '../types';

interface Props {
  body: unknown;
  headers: HarNameValuePair[];
  queryString: HarNameValuePair[];
  cookies: HarCookie[];
  selectedPath: string | null;
  onValueSelect: (path: string, value: string) => void;
}

type Tab = 'body' | 'headers' | 'query' | 'cookies';

export function RequestPanel({ body, headers, queryString, cookies, selectedPath, onValueSelect }: Props) {
  const [tab, setTab] = useState<Tab>('body');

  return (
    <div className="request-panel">
      <div className="request-toolbar">
        <span className="panel-title">Request</span>
        <div className="request-tabs">
          <button className={`req-tab ${tab === 'body' ? 'active' : ''}`} onClick={() => setTab('body')}>
            Body
          </button>
          <button className={`req-tab ${tab === 'headers' ? 'active' : ''}`} onClick={() => setTab('headers')}>
            Headers<span className="req-tab-count">{headers.length}</span>
          </button>
          <button className={`req-tab ${tab === 'query' ? 'active' : ''}`} onClick={() => setTab('query')}>
            Query{queryString.length > 0 && <span className="req-tab-count">{queryString.length}</span>}
          </button>
          <button className={`req-tab ${tab === 'cookies' ? 'active' : ''}`} onClick={() => setTab('cookies')}>
            Cookies{cookies.length > 0 && <span className="req-tab-count">{cookies.length}</span>}
          </button>
        </div>
      </div>

      <div className="request-content">
        {tab === 'body' && (
          <JsonTreeView data={body} selectedPath={selectedPath} onValueSelect={onValueSelect} hideHeader />
        )}
        {tab === 'headers' && <div className="kv-scroll"><KVTable rows={headers} /></div>}
        {tab === 'query'   && <div className="kv-scroll"><KVTable rows={queryString} /></div>}
        {tab === 'cookies' && <div className="kv-scroll"><CookieTable cookies={cookies} /></div>}
      </div>
    </div>
  );
}
