import { useState } from 'react';

interface TocNode {
  index: number;
  level: number;
  text: string;
  children: TocNode[];
}

function buildTocTree(headings: { level: number; text: string }[]): TocNode[] {
  const roots: TocNode[] = [];
  const stack: TocNode[] = [];

  headings.forEach((h, i) => {
    const node: TocNode = { index: i, level: h.level, text: h.text, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });

  return roots;
}

function TocNodeItem({ node, depth, onScroll }: { node: TocNode; depth: number; onScroll: (i: number) => void }) {
  const [collapsed, setCollapsed] = useState(depth >= 1);
  const hasChildren = node.children.length > 0;

  return (
    <div className="toc-node">
      <div className="toc-row">
        {hasChildren ? (
          <button className="toc-toggle" onClick={() => setCollapsed(v => !v)}>
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="toc-toggle-placeholder" />
        )}
        <button className="toc-label-btn" onClick={() => onScroll(node.index)} title={node.text}>
          {node.text}
        </button>
      </div>
      {hasChildren && !collapsed && (
        <div className="toc-children">
          {node.children.map((child, i) => (
            <TocNodeItem key={i} node={child} depth={depth + 1} onScroll={onScroll} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  headings: { level: number; text: string }[];
  onScroll: (index: number) => void;
}

export function TocSidebar({ headings, onScroll }: Props) {
  const roots = buildTocTree(headings);

  return (
    <nav className="toc-sidebar">
      {roots.map((node, i) => (
        <TocNodeItem key={i} node={node} depth={0} onScroll={onScroll} />
      ))}
    </nav>
  );
}
