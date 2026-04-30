import { useState, useCallback } from 'react';

interface Props {
  data: unknown;
  selectedPath: string | null;
  onValueSelect: (path: string, value: string) => void;
  hideHeader?: boolean;
}

interface JsonNodeProps {
  keyName: string | null;
  value: unknown;
  path: string;
  depth: number;
  parentIsArray: boolean;
  selectedPath: string | null;
  onValueSelect: (path: string, value: string) => void;
}

function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function JsonNode({ keyName, value, path, depth, parentIsArray, selectedPath, onValueSelect }: JsonNodeProps) {
  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';
  // auto-expand: root level, or direct children of an array
  const [expanded, setExpanded] = useState(depth < 1 || parentIsArray);
  const isSelected = type === 'string' && path === selectedPath;

  const handleClick = useCallback(() => {
    if (isExpandable) {
      setExpanded((prev) => !prev);
    }
    if (type === 'string') {
      onValueSelect(path, value as string);
    }
  }, [isExpandable, type, path, value, onValueSelect]);

  const entries = isExpandable
    ? Object.entries(value as Record<string, unknown>)
    : [];

  const lineClasses = ['json-line', 'clickable', isSelected ? 'selected' : '']
    .filter(Boolean).join(' ');

  return (
    <div className="json-node" style={{ paddingLeft: depth * 12 }}>
      <div className={lineClasses} onClick={handleClick}>
        <span className={`expand-icon ${isExpandable ? '' : 'invisible'} ${expanded ? 'expanded' : ''}`}>▶</span>
        {keyName !== null && (
          <>
            <span className="json-key">{keyName}</span>
            <span className="json-colon">: </span>
          </>
        )}
        <span className={`json-value json-${type}`}>
          {isExpandable
            ? type === 'array'
              ? `[${entries.length}]`
              : `{${entries.length}}`
            : type === 'string'
              ? `"${truncate(String(value), 80)}"`
              : String(value)}
        </span>
        <span className={`type-badge type-${type}`}>{type}</span>
      </div>
      {expanded && isExpandable && (
        <div className="json-children">
          {entries.map(([k, v]) => (
            <JsonNode
              key={k}
              keyName={k}
              value={v}
              path={path ? `${path}.${k}` : k}
              depth={depth + 1}
              parentIsArray={type === 'array'}
              selectedPath={selectedPath}
              onValueSelect={onValueSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function truncate(s: string, max: number): string {
  const oneLine = s.replace(/\n/g, '\\n');
  return oneLine.length > max ? oneLine.slice(0, max) + '...' : oneLine;
}

export function JsonTreeView({ data, selectedPath, onValueSelect, hideHeader }: Props) {
  return (
    <div className="json-tree-container">
      {!hideHeader && <div className="json-tree-header">Request</div>}
      {data === undefined || data === null ? (
        <div className="json-tree empty">No request body</div>
      ) : (
        <div className="json-tree">
          <JsonNode
            keyName={null}
            value={data}
            path=""
            depth={0}
            parentIsArray={false}
            selectedPath={selectedPath}
            onValueSelect={onValueSelect}
          />
        </div>
      )}
    </div>
  );
}
