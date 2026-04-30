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
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div className="toc-node">
      <div className="toc-row">
        <button
          className="toc-expand-btn"
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          onClick={() => setExpanded(v => !v)}
          tabIndex={hasChildren ? 0 : -1}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button className="toc-label-btn" onClick={() => onScroll(node.index)} title={node.text}>
          {node.text}
        </button>
      </div>
      {hasChildren && expanded && (
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
