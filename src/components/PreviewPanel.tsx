import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { escapeHtml } from '../utils/markdown';

interface Props {
  title?: string;
  subtitle?: string;
  content: string | null;
  emptyText?: string;
  hideTitle?: boolean;
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

export function PreviewPanel({ title, subtitle, content, emptyText, hideTitle }: Props) {
  return (
    <div className="preview-panel">
      {!hideTitle && (
        <div className="preview-toolbar">
          <div className="preview-title">
            <span>{title}</span>
            {subtitle && <span className="tab-path">{subtitle}</span>}
          </div>
        </div>
      )}
      <div className="preview-content">
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
  );
}
