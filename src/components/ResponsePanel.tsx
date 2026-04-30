import { useState } from 'react';
import { StreamViewer } from './StreamViewer';
import { PreviewPanel } from './PreviewPanel';
import { OverviewPanel } from './OverviewPanel';
import { KVTable, CookieTable } from './KVTable';
import type { HarNameValuePair, HarCookie, ParsedEntry } from '../types';

interface Props {
  entry: ParsedEntry | null;
}

type Tab = 'overview' | 'body' | 'headers' | 'cookies';

export function ResponsePanel({ entry }: Props) {
  const [tab, setTab] = useState<Tab>('body');

  const responseHeaders: HarNameValuePair[] = entry?.responseHeaders ?? [];
  const responseCookies: HarCookie[] = entry?.responseCookies ?? [];
  const responseBody = entry?.responseBody ?? null;
  const isStreaming = entry?.isStreaming ?? false;

  return (
    <div className="response-panel">
      <div className="response-toolbar">
        <span className="panel-title">Response</span>
        <div className="request-tabs">
          <button className={`req-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            Overview
          </button>
          <button className={`req-tab ${tab === 'body' ? 'active' : ''}`} onClick={() => setTab('body')}>
            Body
          </button>
          <button className={`req-tab ${tab === 'headers' ? 'active' : ''}`} onClick={() => setTab('headers')}>
            Headers<span className="req-tab-count">{responseHeaders.length}</span>
          </button>
          <button className={`req-tab ${tab === 'cookies' ? 'active' : ''}`} onClick={() => setTab('cookies')}>
            Cookies{responseCookies.length > 0 && <span className="req-tab-count">{responseCookies.length}</span>}
          </button>
        </div>
      </div>

      <div className="response-content">
        {tab === 'overview' && (
          entry ? <OverviewPanel entry={entry} /> : <div className="kv-empty">选择左侧请求</div>
        )}
        {tab === 'body' && (
          isStreaming && responseBody ? (
            <StreamViewer responseBody={responseBody} hideTitle />
          ) : (
            <PreviewPanel content={responseBody} emptyText="选择左侧请求以查看响应" hideTitle />
          )
        )}
        {tab === 'headers' && <div className="kv-scroll"><KVTable rows={responseHeaders} /></div>}
        {tab === 'cookies' && <div className="kv-scroll"><CookieTable cookies={responseCookies} /></div>}
      </div>
    </div>
  );
}
