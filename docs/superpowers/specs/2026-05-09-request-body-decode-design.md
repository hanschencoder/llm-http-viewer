# Request Body Decode Feature — Design Spec

**Date:** 2026-05-09

## Problem

When a HAR request body is not valid JSON (e.g., Qoder-encoded), the viewer currently displays it as a raw string with no tree structure. Users cannot inspect the underlying data.

## Goal

Provide a "解码" button in the RequestPanel Body tab that decodes an encoded string into JSON and displays it as a JSON tree. A "还原" button restores the original raw string. The decoded body is propagated to App state so all existing features (prompt extractor, etc.) can use it.

---

## Architecture

### 1. `src/utils/decoders.ts` (new file)

Defines the extensible decoder registry.

```typescript
interface DecoderDef {
  id: string;
  label: string;
  decode: (input: string) => unknown;  // throws on failure
}
```

**Built-in: Qoder decoder** — TypeScript port of `decode_llm.py`:

1. Map each character through the custom alphabet (`MAPPING: Record<string, string>`, 64-entry dict)
2. Extract three fixed segments from the mapped string:
   - `seg1 = mapped[1:56689]`
   - `seg2 = mapped[56692:113376]`
   - `seg3 = mapped[113379:170067]`
3. Reassemble in order: `seg3 + seg2 + seg1`
4. `atob()` → `TextDecoder('utf-8').decode()` → `JSON.parse()`

Exports:
- `DECODERS: DecoderDef[]` — ordered list (Qoder first)
- `runDecoder(id: string, input: string): { ok: true; result: unknown } | { ok: false; error: string }`

### 2. `src/types.ts`

Add one optional field to `ParsedEntry`:

```typescript
rawRequestBody?: string;  // original string before decode; present only when decoded
```

### 3. `src/App.tsx`

Two new callbacks, each updates both `entries` array and `selectedEntry` state synchronously:

**`handleBodyDecode(decodedBody: unknown)`**
- Sets `selectedEntry.rawRequestBody = selectedEntry.requestBody as string`
- Sets `selectedEntry.requestBody = decodedBody`
- Mirrors changes in `entries` array

**`handleBodyRestore()`**
- Sets `selectedEntry.requestBody = selectedEntry.rawRequestBody`
- Clears `selectedEntry.rawRequestBody`
- Mirrors changes in `entries` array

New props passed to `RequestPanel`:
```typescript
isDecoded={!!selectedEntry?.rawRequestBody}
onBodyDecode={handleBodyDecode}
onBodyRestore={handleBodyRestore}
```

### 4. `src/components/RequestPanel.tsx`

New props:
```typescript
isDecoded?: boolean;
onBodyDecode?: (decodedBody: unknown) => void;
onBodyRestore?: () => void;
```

Local state:
```typescript
const [decodeError, setDecodeError] = useState<string | null>(null);
```

**Toolbar logic (Body tab only):**

| Condition | UI |
|-----------|-----|
| `typeof body === 'string'` && `!isDecoded` | "解码 ▾" dropdown listing `DECODERS` |
| `isDecoded === true` | "已解码" badge + "还原" button |
| Decode fails | Inline error below toolbar, raw string remains visible |

**Decode flow:**
1. User selects decoder from dropdown
2. Call `runDecoder(id, body as string)`
3. On `ok: true` → `setDecodeError(null)`, call `onBodyDecode(result)`
4. On `ok: false` → `setDecodeError(error.message)`, body unchanged

**Restore flow:**
- "还原" button calls `onBodyRestore()`, clears `decodeError`

---

## Data Flow

```
User clicks "解码 ▾" → selects "Qoder"
  → RequestPanel: runDecoder('qoder', body)
    → ok → onBodyDecode(decodedJSON)
      → App.handleBodyDecode: update entries + selectedEntry
        → RequestPanel re-renders with body=decodedJSON (object, not string)
          → JsonTreeView shows JSON tree
          → toolbar shows "已解码" + "还原"
```

---

## Out of Scope

- Persisting decoded state across page reload (HAR is re-parsed fresh each load)
- True decryption (requires keys; Qoder is encoding, not encryption)
- Auto-decoding at HAR parse time
- Adding custom decoders via UI (registry is code-only for now)
