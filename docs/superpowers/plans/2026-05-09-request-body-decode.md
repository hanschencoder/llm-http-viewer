# Request Body Decode Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "解码" dropdown button to the RequestPanel Body tab that decodes Qoder-encoded request bodies into JSON and displays them as a tree, with a "还原" button to revert.

**Architecture:** A new `src/utils/decoders.ts` holds the decoder registry (Qoder built-in, extensible). `ParsedEntry` gains an optional `rawRequestBody` field. App.tsx adds `handleBodyDecode` / `handleBodyRestore` that update both `entries` and `selectedEntry`. RequestPanel receives three new props and renders the decode dropdown, decoded badge, restore button, and inline error.

**Tech Stack:** React 19 + TypeScript 6, Vite, no test framework (verify with `npm run build` + manual browser check).

---

### Task 1: Create `src/utils/decoders.ts`

**Files:**
- Create: `src/utils/decoders.ts`

- [ ] **Step 1: Create the file with full Qoder implementation**

Create `/home/chenhang/work/llm-http-viewer/src/utils/decoders.ts` with this exact content:

```typescript
export interface DecoderDef {
  id: string;
  label: string;
  decode: (input: string) => unknown;
}

const QODER_MAPPING: Record<string, string> = {
  'P': 'a', 'H': 'G', 'F': 'V', 'r': 's', 'u': 'b', '!': '/', 'b': 'v', 'B': 'I',
  '^': 'z', 'z': 'k', 'R': 'D', 'L': 'l', 'M': 'j', 'y': '6', 'h': 'u', 'x': 'X',
  '&': 'g', 'D': 'Z', 'U': 'r', 'I': '4', '#': 'Y', 'Q': '5', ',': 'S', 'n': 'o',
  '*': 'i', 'k': '3', 'G': 'L', '(': '2', 'A': '+', '_': 'A', 'O': 'm', 'j': 'N',
  'w': '0', 'S': 'W', 'K': 'J', ')': 'p', 'N': 'c', 'Z': 'H', 'C': 'R', 'J': 'd',
  '.': '1', 'g': 'F', 'i': 'h', 'a': 'U', 'E': 'n', 'f': 'w', 'Y': 'y', 's': 'q',
  't': 't', 'd': 'B', 'V': 'M', 'm': 'e', 'q': '8', '%': 'x', 'l': 'O', 'p': 'Q',
  'W': '9', 'o': 'C', 'T': 'E', '@': 'T', 'v': 'P', 'c': 'K', 'e': 'f', 'X': '7',
};

const SEG1_START = 1,   SEG1_END = 56689;
const SEG2_START = 56692, SEG2_END = 113376;
const SEG3_START = 113379, SEG3_END = 170067;

function decodeQoder(input: string): unknown {
  const stdB64 = input.split('').map(ch => {
    const mapped = QODER_MAPPING[ch];
    if (mapped === undefined) throw new Error(`Unknown character: ${JSON.stringify(ch)}`);
    return mapped;
  }).join('');

  const seg1 = stdB64.slice(SEG1_START, SEG1_END);
  const seg2 = stdB64.slice(SEG2_START, SEG2_END);
  const seg3 = stdB64.slice(SEG3_START, SEG3_END);
  const combined = seg3 + seg2 + seg1;

  const raw = atob(combined);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const text = new TextDecoder('utf-8').decode(bytes);

  return JSON.parse(text);
}

export const DECODERS: DecoderDef[] = [
  { id: 'qoder', label: 'Qoder', decode: decodeQoder },
];

export function runDecoder(
  id: string,
  input: string,
): { ok: true; result: unknown } | { ok: false; error: string } {
  const def = DECODERS.find(d => d.id === id);
  if (!def) return { ok: false, error: `Unknown decoder: ${id}` };
  try {
    return { ok: true, result: def.decode(input) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `cd /home/chenhang/work/llm-http-viewer && npm run build`

Expected: build succeeds with no TypeScript errors. (Warnings about unused imports in other files are OK.)

- [ ] **Step 3: Commit**

```bash
git add src/utils/decoders.ts
git commit -m "feat(decode): add decoder registry with Qoder algorithm"
```

---

### Task 2: Add `rawRequestBody` to `ParsedEntry`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add the field to ParsedEntry**

In `src/types.ts`, find the `ParsedEntry` interface (line 80). Add one line after `requestBody: unknown;`:

```typescript
  rawRequestBody?: string;
```

The interface block should now contain:
```typescript
export interface ParsedEntry {
  id: string;
  index: number;
  method: string;
  url: string;
  status: number;
  statusText: string;
  time: number;
  startedDateTime: string;
  httpVersion: string;
  requestBody: unknown;
  rawRequestBody?: string;
  // ... rest unchanged
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `cd /home/chenhang/work/llm-http-viewer && npm run build`

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(decode): add rawRequestBody field to ParsedEntry"
```

---

### Task 3: Add decode/restore handlers to `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the two callbacks**

In `src/App.tsx`, after the `handleValueSelect` callback (around line 51), add:

```typescript
  const handleBodyDecode = useCallback((decodedBody: unknown) => {
    if (!selectedEntry) return;
    const rawBody = selectedEntry.requestBody as string;
    const updated: ParsedEntry = { ...selectedEntry, requestBody: decodedBody, rawRequestBody: rawBody };
    setSelectedEntry(updated);
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, [selectedEntry]);

  const handleBodyRestore = useCallback(() => {
    if (!selectedEntry?.rawRequestBody) return;
    const updated: ParsedEntry = {
      ...selectedEntry,
      requestBody: selectedEntry.rawRequestBody,
      rawRequestBody: undefined,
    };
    setSelectedEntry(updated);
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, [selectedEntry]);
```

- [ ] **Step 2: Pass new props to RequestPanel**

Find the `<RequestPanel` JSX block (around line 92). Add three new props so it reads:

```tsx
<RequestPanel
  body={selectedEntry?.requestBody ?? null}
  url={selectedEntry?.url ?? ''}
  headers={selectedEntry?.requestHeaders ?? []}
  queryString={selectedEntry?.queryString ?? []}
  cookies={selectedEntry?.requestCookies ?? []}
  selectedPath={selectedPath}
  isDecoded={!!selectedEntry?.rawRequestBody}
  onBodyDecode={handleBodyDecode}
  onBodyRestore={handleBodyRestore}
  onValueSelect={handleValueSelect}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(decode): add handleBodyDecode and handleBodyRestore in App"
```

---

### Task 4: Update `src/components/RequestPanel.tsx`

**Files:**
- Modify: `src/components/RequestPanel.tsx`

- [ ] **Step 1: Replace the entire file with the updated version**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `cd /home/chenhang/work/llm-http-viewer && npm run build`

Expected: build succeeds with zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RequestPanel.tsx
git commit -m "feat(decode): add decode dropdown and restore button to RequestPanel"
```

---

### Task 5: Add CSS for decode UI elements

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Append new CSS rules at the end of `src/App.css`**

Add the following block at the very end of the file:

```css
/* ── Request Body Decode ── */
.toolbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.toolbar-actions .btn-secondary {
  margin-left: 0;
}

.decode-dropdown-wrapper {
  position: relative;
}

.decode-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 200;
  min-width: 120px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.decode-menu-item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-5);
  font-size: var(--font-size-xs);
  text-align: left;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.decode-menu-item:hover {
  background: var(--color-accent-bg);
  color: var(--color-accent);
}

.decoded-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid rgba(52, 211, 153, 0.3);
  white-space: nowrap;
}

.decode-error {
  padding: var(--space-2) var(--space-5);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  background: rgba(248, 113, 113, 0.08);
  border-bottom: 1px solid var(--color-border-default);
  word-break: break-all;
}
```

- [ ] **Step 2: Start dev server and manually test**

Run: `cd /home/chenhang/work/llm-http-viewer && npm run dev`

Open the app in browser. Test the following scenarios:

**Scenario A — Normal JSON body (existing behavior unchanged):**
1. Load a HAR file with a standard JSON request body
2. Select the entry → Body tab
3. Confirm: no "解码" button visible, JSON tree renders normally

**Scenario B — Encoded string body:**
1. Load a HAR file with a Qoder-encoded body (non-JSON string)
2. Select the entry → Body tab
3. Confirm: "解码 ▾" button appears; "提取提示词" button still present
4. Click "解码 ▾" → dropdown shows "Qoder"
5. Click "Qoder" → JSON tree renders with decoded content; "已解码" badge + "还原" button appear; "解码 ▾" button disappears
6. Click "还原" → raw string view returns; "解码 ▾" button reappears; "已解码"/"还原" disappear

**Scenario C — Decode failure:**
1. Select an entry where body is a short plain string (not valid Qoder)
2. Click "解码 ▾" → "Qoder"
3. Confirm: red error bar "解码失败：..." appears; body display unchanged

**Scenario D — Clicking outside closes dropdown:**
1. Click "解码 ▾" to open dropdown
2. Click anywhere outside the dropdown
3. Confirm: dropdown closes without decoding

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(decode): add CSS for decode dropdown, decoded badge, and error display"
```
