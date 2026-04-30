import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { parseStreamResponse } from '../utils/stream-parser';

interface Props {
  responseBody: string;
  hideTitle?: boolean;
}

type Tab = 'reconstructed' | 'chunks';

export function StreamViewer({ responseBody, hideTitle }: Props) {
  const [tab, setTab] = useState<Tab>('reconstructed');
  const [forceMode, setForceMode] = useState<'sse' | 'raw' | null>(null);

  const result = useMemo(
    () => parseStreamResponse(responseBody, forceMode ?? undefined),
    [responseBody, forceMode]
  );

  return (
    <div className="stream-viewer">
      <div className="stream-toolbar">
        {!hideTitle && <span className="panel-title">Response</span>}
        <div className="stream-tabs">
          <button className={`tab ${tab === 'reconstructed' ? 'active' : ''}`} onClick={() => setTab('reconstructed')}>
            重建内容
          </button>
          <button className={`tab ${tab === 'chunks' ? 'active' : ''}`} onClick={() => setTab('chunks')}>
            原始分块 ({result.chunks.length})
          </button>
        </div>
        <div className="mode-toggle">
          {(['sse', 'raw'] as const).map((m) => {
            const isActive = forceMode === m || (forceMode === null && result.mode === m);
            const isForced = forceMode === m;
            return (
              <button
                key={m}
                className={`mode-btn ${isActive ? 'active' : ''}`}
                onClick={() => setForceMode(isForced ? null : m)}
                title={isForced ? '点击取消强制，恢复自动检测' : undefined}
              >
                {m.toUpperCase()}
                {isActive && !isForced && <span className="mode-auto-dot" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="stream-content">
        {tab === 'reconstructed' ? (
          result.reconstructed ? (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {result.reconstructed}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="preview-empty">未能从响应中提取到内容</div>
          )
        ) : (
          <div className="chunks-list">
            {result.chunks.map((chunk) => (
              <div key={chunk.index} className="chunk-card">
                <div className="chunk-header">
                  <span className="chunk-index">#{chunk.index}</span>
                  {chunk.extractedText && (
                    <span className="chunk-text-preview">
                      {chunk.extractedText.length > 60
                        ? chunk.extractedText.slice(0, 60) + '...'
                        : chunk.extractedText}
                    </span>
                  )}
                </div>
                <pre className="chunk-raw">{chunk.rawData}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
