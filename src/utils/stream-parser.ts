import type { StreamChunk, StreamParseResult } from '../types';

type ContentType = 'thinking' | 'content' | 'tool';

interface DeltaResult {
  text: string;
  type: ContentType;
}

interface ToolState {
  name: string;
  id: string;
  partialJson: string;
}

export function parseStreamResponse(body: string, forceMode?: 'sse' | 'raw'): StreamParseResult {
  const mode = forceMode ?? detectMode(body);

  if (mode === 'sse') {
    return parseSSE(body);
  }
  return { mode: 'raw', chunks: [{ index: 0, rawData: body, extractedText: body, contentType: 'content' }], reconstructed: body };
}

function detectMode(body: string): 'sse' | 'raw' {
  if (/^data:\s/m.test(body)) return 'sse';
  return 'raw';
}

function parseSSE(body: string): StreamParseResult {
  const chunks: StreamChunk[] = [];
  const segments: DeltaResult[] = [];
  const toolAccumulator = new Map<number, ToolState>();

  // Split by double newline to get SSE blocks, then by single newline within each block
  const blocks = body.split(/\n\n+/);

  let chunkIndex = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Each block may have multiple lines; extract all data: lines
    const dataLines = trimmed.split('\n').filter((l) => l.startsWith('data:'));

    for (const line of dataLines) {
      // Handle both "data: xxx" and "data:xxx"
      const data = line.slice(5).trimStart().trim();
      if (!data) continue;

      if (data === '[DONE]') {
        chunks.push({ index: chunkIndex++, rawData: '[DONE]' });
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        chunks.push({ index: chunkIndex++, rawData: data });
        continue;
      }

      // Handle tool accumulation (streaming partial_json / arguments)
      const toolResult = handleToolAccumulation(parsed, toolAccumulator);
      if (toolResult) segments.push(toolResult);

      const extracted = extractDelta(parsed);
      if (extracted) segments.push(extracted);

      const text = toolResult?.text ?? extracted?.text;
      const type = toolResult?.type ?? extracted?.type;

      chunks.push({
        index: chunkIndex++,
        rawData: data,
        parsedData: parsed,
        extractedText: text,
        contentType: type,
      });
    }
  }

  // Flush any remaining accumulated tools
  for (const [, tool] of toolAccumulator) {
    segments.push({ text: formatToolCall(tool.name, tool.id, tool.partialJson), type: 'tool' });
  }

  // Build reconstructed text with section headers when type changes
  const reconstructed = buildReconstructed(segments);

  return { mode: 'sse', chunks, reconstructed };
}

function handleToolAccumulation(data: unknown, accumulator: Map<number, ToolState>): DeltaResult | null {
  if (typeof data !== 'object' || data === null) return null;
  const obj = data as Record<string, unknown>;

  // Anthropic: content_block_start with tool_use
  if (obj.type === 'content_block_start') {
    const cb = obj.content_block as Record<string, unknown> | undefined;
    if (cb?.type === 'tool_use' && typeof cb.name === 'string') {
      const index = typeof obj.index === 'number' ? obj.index : -1;
      accumulator.set(index, { name: cb.name, id: String(cb.id ?? ''), partialJson: '' });
      return null;
    }
  }

  // Anthropic: content_block_delta with input_json_delta
  if (obj.type === 'content_block_delta') {
    const delta = obj.delta as Record<string, unknown> | undefined;
    if (delta?.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
      const index = typeof obj.index === 'number' ? obj.index : -1;
      const state = accumulator.get(index);
      if (state) {
        state.partialJson += delta.partial_json;
        accumulator.set(index, state);
      }
      return null;
    }
  }

  // Anthropic: content_block_stop → emit completed tool
  if (obj.type === 'content_block_stop') {
    const index = typeof obj.index === 'number' ? obj.index : -1;
    const state = accumulator.get(index);
    if (state) {
      accumulator.delete(index);
      return { text: formatToolCall(state.name, state.id, state.partialJson), type: 'tool' };
    }
    return null;
  }

  // OpenAI: choices[].delta.tool_calls[] (streaming)
  if (Array.isArray(obj.choices)) {
    for (const choice of obj.choices) {
      const c = choice as Record<string, unknown>;
      const delta = c?.delta as Record<string, unknown> | undefined;
      const toolCalls = delta?.tool_calls as unknown[] | undefined;
      if (!Array.isArray(toolCalls)) continue;

      for (const tc of toolCalls) {
        const call = tc as Record<string, unknown>;
        const idx = typeof call.index === 'number' ? call.index : -1;
        const fn = call.function as Record<string, unknown> | undefined;

        // New tool call start (has id and name)
        if (typeof call.id === 'string' && typeof fn?.name === 'string') {
          // Flush previous tool at same index if any
          const prev = accumulator.get(idx);
          if (prev) {
            accumulator.delete(idx);
            return { text: formatToolCall(prev.name, prev.id, prev.partialJson), type: 'tool' };
          }
          accumulator.set(idx, { name: fn.name, id: call.id, partialJson: '' });
        }

        // Accumulate arguments
        if (typeof fn?.arguments === 'string') {
          const state = accumulator.get(idx);
          if (state) {
            state.partialJson += fn.arguments;
            accumulator.set(idx, state);
          }
        }
      }
    }
  }

  // OpenAI: choices[].message.tool_calls[] (non-streaming)
  if (Array.isArray(obj.choices)) {
    for (const choice of obj.choices) {
      const c = choice as Record<string, unknown>;
      const message = c?.message as Record<string, unknown> | undefined;
      const toolCalls = message?.tool_calls as unknown[] | undefined;
      if (!Array.isArray(toolCalls)) continue;

      const parts: string[] = [];
      for (const tc of toolCalls) {
        const call = tc as Record<string, unknown>;
        const fn = call.function as Record<string, unknown> | undefined;
        if (typeof fn?.name === 'string') {
          parts.push(formatToolCall(fn.name, String(call.id ?? ''), typeof fn.arguments === 'string' ? fn.arguments : ''));
        }
      }
      if (parts.length > 0) {
        return { text: parts.join('\n\n'), type: 'tool' };
      }
    }
  }

  return null;
}

function formatToolCall(name: string, _id: string, argsJson: string): string {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsJson);
  } catch {
    if (argsJson) return `**${name}**: ${argsJson}`;
  }

  const entries = Object.entries(args);
  if (entries.length === 0) return `**${name}**`;
  if (entries.length === 1) return `**${name}**: ${String(entries[0][1])}`;

  const pairs = entries.map(([k, v]) => `${k}=${String(v)}`).join(', ');
  return `**${name}**: ${pairs}`;
}

function buildReconstructed(segments: DeltaResult[]): string {
  if (segments.length === 0) return '';

  // Check if there are multiple content types
  const types = new Set(segments.map((s) => s.type));
  const hasMultipleTypes = types.size > 1;

  if (!hasMultipleTypes) {
    const sep = segments[0]?.type === 'tool' ? '\n\n' : '';
    return segments.map((s) => s.text).join(sep);
  }

  // Insert headers when content type changes
  const parts: string[] = [];
  let lastType: ContentType | null = null;

  for (const seg of segments) {
    if (seg.type !== lastType) {
      if (parts.length > 0) parts.push('\n\n');
      const header = seg.type === 'thinking' ? '## Thinking\n\n' : seg.type === 'tool' ? '## Tool Use\n\n' : '## Response\n\n';
      parts.push(header);
      lastType = seg.type;
    } else if (seg.type === 'tool' && parts.length > 0) {
      parts.push('\n\n');
    }
    parts.push(seg.text);
  }

  return parts.join('');
}

function extractDelta(data: unknown): DeltaResult | null {
  if (typeof data !== 'object' || data === null) return null;
  const obj = data as Record<string, unknown>;

  // OpenAI format: choices[].delta.content / reasoning_content
  if (Array.isArray(obj.choices)) {
    const parts: { text: string; type: ContentType }[] = [];
    for (const choice of obj.choices) {
      const c = choice as Record<string, unknown>;
      const delta = c?.delta as Record<string, unknown> | undefined;
      if (delta?.content && typeof delta.content === 'string') {
        parts.push({ text: delta.content, type: 'content' });
      }
      if (delta?.reasoning_content && typeof delta.reasoning_content === 'string') {
        parts.push({ text: delta.reasoning_content, type: 'thinking' });
      }
      // Also handle non-streaming response format: choices[].message.content / reasoning_content
      const message = c?.message as Record<string, unknown> | undefined;
      if (message?.content && typeof message.content === 'string') {
        parts.push({ text: message.content, type: 'content' });
      }
      if (message?.reasoning_content && typeof message.reasoning_content === 'string') {
        parts.push({ text: message.reasoning_content, type: 'thinking' });
      }
    }
    if (parts.length > 0) {
      const combinedType: ContentType = parts.some((p) => p.type === 'content') ? 'content' : 'thinking';
      return { text: parts.map((p) => p.text).join(''), type: combinedType };
    }
  }

  // Anthropic format: content_block_delta.delta.text / delta.thinking
  if (obj.type === 'content_block_delta') {
    const delta = obj.delta as Record<string, unknown> | undefined;
    if (delta?.text && typeof delta.text === 'string') {
      return { text: delta.text, type: 'content' };
    }
    if (delta?.thinking && typeof delta.thinking === 'string') {
      return { text: delta.thinking, type: 'thinking' };
    }
    if (delta?.content && typeof delta.content === 'string') {
      return { text: delta.content, type: 'content' };
    }
  }

  // Anthropic non-streaming: content[].text / content[].thinking / content[].tool_use
  if (Array.isArray(obj.content)) {
    const parts: { text: string; type: ContentType }[] = [];
    for (const block of obj.content) {
      const b = block as Record<string, unknown>;
      if (b.type === 'text' && typeof b.text === 'string') {
        parts.push({ text: b.text, type: 'content' });
      }
      if (b.type === 'thinking' && typeof b.thinking === 'string') {
        parts.push({ text: b.thinking, type: 'thinking' });
      }
      if (b.type === 'tool_use' && typeof b.name === 'string') {
        parts.push({ text: formatToolCall(b.name, String(b.id ?? ''), JSON.stringify(b.input ?? {})), type: 'tool' });
      }
    }
    if (parts.length > 0) {
      const types = new Set(parts.map((p) => p.type));
      const combinedType: ContentType = types.size === 1 ? [...types][0] : (types.has('content') ? 'content' : types.has('tool') ? 'tool' : 'thinking');
      return { text: parts.map((p) => p.text).join('\n\n'), type: combinedType };
    }
  }

  // Generic fallback: look for common field names
  for (const key of ['content', 'text', 'delta']) {
    if (typeof obj[key] === 'string') return { text: obj[key] as string, type: 'content' };
  }

  return null;
}

/** Try to extract readable text from a non-streaming LLM response body */
export function extractResponseText(body: string): string | null {
  // Try parsing as JSON first
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  return extractDelta(parsed)?.text ?? null;
}
