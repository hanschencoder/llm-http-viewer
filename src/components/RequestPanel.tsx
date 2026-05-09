import { useState, useMemo, useEffect, useRef } from 'react';
import { JsonTreeView } from './JsonTreeView';
import { KVTable, CookieTable } from './KVTable';
import { detectFormat, extractPrompt } from '../utils/prompt-extractor';
import { DECODERS, runDecoder } from '../utils/decoders';
import type { HarNameValuePair, HarCookie } from '../types';

interface Props {
  body: unknown;
  url: string;
  headers: HarNameValuePair[];
  queryString: HarNameValuePair[];
  cookies: HarCookie[];
  selectedPath: string | null;
  isDecoded?: boolean;
  onValueSelect: (path: string, value: string) => void;
  onBodyDecode?: (decodedBody: unknown) => void;
  onBodyRestore?: () => void;
}

type Tab = 'body' | 'headers' | 'query' | 'cookies';

export function RequestPanel({
  body, url, headers, queryString, cookies, selectedPath,
  isDecoded, onValueSelect, onBodyDecode, onBodyRestore,
}: Props) {
  const [tab, setTab] = useState<Tab>('body');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [showDecodeMenu, setShowDecodeMenu] = useState(false);
  const decodeMenuRef = useRef<HTMLDivElement>(null);
  const format = useMemo(() => detectFormat(body, url), [body, url]);

  // Close decode menu when clicking outside
  useEffect(() => {
    if (!showDecodeMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (decodeMenuRef.current && !decodeMenuRef.current.contains(e.target as Node)) {
        setShowDecodeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDecodeMenu]);

  function handleExtract() {
    const markdown = extractPrompt(body, url);
    if (markdown) onValueSelect('Prompts', markdown);
  }

  function handleDecode(decoderId: string) {
    setShowDecodeMenu(false);
    if (typeof body !== 'string') return;
    const result = runDecoder(decoderId, body);
    if (result.ok) {
      setDecodeError(null);
      onBodyDecode?.(result.result);
    } else {
      setDecodeError(result.error);
    }
  }

  function handleRestore() {
    setDecodeError(null);
    onBodyRestore?.();
  }

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

        {tab === 'body' && (
          <div className="toolbar-actions">
            {typeof body === 'string' && !isDecoded && (
              <div className="decode-dropdown-wrapper" ref={decodeMenuRef}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowDecodeMenu(v => !v)}
                >
                  解码 ▾
                </button>
                {showDecodeMenu && (
                  <div className="decode-menu">
                    {DECODERS.map(d => (
                      <button key={d.id} className="decode-menu-item" onClick={() => handleDecode(d.id)}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isDecoded && (
              <>
                <span className="decoded-badge">已解码</span>
                <button className="btn-secondary" onClick={handleRestore}>还原</button>
              </>
            )}
            <button
              className="btn-secondary"
              onClick={handleExtract}
              disabled={!format}
              title={format ? `提取 ${format === 'openai' ? 'OpenAI' : 'Anthropic'} 提示词` : '未检测到 OpenAI/Anthropic 格式'}
            >
              提取提示词
            </button>
          </div>
        )}
      </div>

      {tab === 'body' && decodeError && (
        <div className="decode-error">解码失败：{decodeError}</div>
      )}

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
