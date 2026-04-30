import type { StreamChunk, StreamParseResult } from '../types';

export function parseStreamResponse(body: string, forceMode?: 'sse' | 'raw'): StreamParseResult {
  const mode = forceMode ?? detectMode(body);

  if (mode === 'sse') {
    return parseSSE(body);
  }
  return { mode: 'raw', chunks: [{ index: 0, rawData: body, extractedText: body }], reconstructed: body };
}

function detectMode(body: string): 'sse' | 'raw' {
  if (/^data:\s/m.test(body)) return 'sse';
  return 'raw';
}

function parseSSE(body: string): StreamParseResult {
  const chunks: StreamChunk[] = [];
  const textParts: string[] = [];

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

      const extracted = extractDeltaContent(parsed);
      if (extracted) textParts.push(extracted);

      chunks.push({
        index: chunkIndex++,
        rawData: data,
        parsedData: parsed,
        extractedText: extracted ?? undefined,
      });
    }
  }

  return { mode: 'sse', chunks, reconstructed: textParts.join('') };
}

function extractDeltaContent(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const obj = data as Record<string, unknown>;

  // OpenAI format: choices[].delta.content
  if (Array.isArray(obj.choices)) {
    const parts: string[] = [];
    for (const choice of obj.choices) {
      const c = choice as Record<string, unknown>;
      const delta = c?.delta as Record<string, unknown> | undefined;
      if (delta?.content && typeof delta.content === 'string') {
        parts.push(delta.content);
      }
      // Also handle non-streaming response format: choices[].message.content
      const message = c?.message as Record<string, unknown> | undefined;
      if (message?.content && typeof message.content === 'string') {
        parts.push(message.content);
      }
    }
    if (parts.length > 0) return parts.join('');
  }

  // Anthropic format: content_block_delta.delta.text
  if (obj.type === 'content_block_delta') {
    const delta = obj.delta as Record<string, unknown> | undefined;
    if (delta?.text && typeof delta.text === 'string') {
      return delta.text;
    }
    if (delta?.content && typeof delta.content === 'string') {
      return delta.content;
    }
  }

  // Anthropic non-streaming: content[].text
  if (Array.isArray(obj.content)) {
    const parts: string[] = [];
    for (const block of obj.content) {
      const b = block as Record<string, unknown>;
      if (b.type === 'text' && typeof b.text === 'string') {
        parts.push(b.text);
      }
    }
    if (parts.length > 0) return parts.join('');
  }

  // Generic fallback: look for common field names
  for (const key of ['content', 'text', 'delta']) {
    if (typeof obj[key] === 'string') return obj[key] as string;
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
  return extractDeltaContent(parsed);
}
