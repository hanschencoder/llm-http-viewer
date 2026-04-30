import { useState, useCallback, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { escapeHtml } from '../utils/markdown';
import { TocSidebar } from './TocSidebar';

interface Props {
  title?: string;
  subtitle?: string;
  content: string | null;
  emptyText?: string;
  hideTitle?: boolean;
}

interface Heading {
  level: number;
  text: string;
}

function isJson(text: string): boolean {
  const t = text.trim();
  if (
    (t.startsWith('{') && t.endsWith('}')) ||
    (t.startsWith('[') && t.endsWith(']'))
  ) {
    try { JSON.parse(t); return true; } catch { /* not JSON */ }
  }
  return false;
}

function parseHeadings(content: string): Heading[] {
  const result: Heading[] = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    result.push({ level: match[1].length, text: match[2].trim() });
  }
  return result;
}

export function PreviewPanel({ title, subtitle, content, emptyText, hideTitle }: Props) {
  const [copied, setCopied] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const isMarkdown = !!content && !isJson(content);
  const headings = useMemo(() => isMarkdown ? parseHeadings(content!) : [], [content, isMarkdown]);

  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [content]);

  const scrollToHeading = useCallback((index: number) => {
    if (!contentRef.current) return;
    const nodes = contentRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6');
    nodes[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const showToolbar = !hideTitle || !!content;
  const showToc = tocOpen && headings.length > 0;

  return (
    <div className="preview-panel">
      {showToolbar && (
        <div className="preview-toolbar">
          <div className="preview-title">
            {!hideTitle && <span>{title}</span>}
            {!hideTitle && subtitle && <span className="tab-path">{subtitle}</span>}
          </div>
          <div className="preview-toolbar-actions">
            {isMarkdown && headings.length > 0 && (
              <button
                className={`toc-toggle-btn ${tocOpen ? 'active' : ''}`}
                onClick={() => setTocOpen(v => !v)}
                title={tocOpen ? '隐藏目录' : '显示目录'}
              >
                目录
              </button>
            )}
            {content && (
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="复制全部文本"
              >
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="preview-body">
        {showToc && (
          <TocSidebar headings={headings} onScroll={scrollToHeading} />
        )}
        <div className="preview-content" ref={contentRef}>
          {content ? (
            isJson(content) ? (
              <pre className="raw-content">{escapeHtml(content)}</pre>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )
          ) : (
            <div className="preview-empty">{emptyText ?? '暂无内容'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
