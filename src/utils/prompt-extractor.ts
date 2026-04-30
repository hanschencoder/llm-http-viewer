type ContentPart = Record<string, unknown> & { type: string };

type MessageRole = string;
interface Message {
  role: MessageRole;
  content: string | ContentPart[];
}

interface OpenAIBody {
  model?: string;
  messages?: Message[];
}

interface AnthropicBody {
  model?: string;
  system?: string | ContentPart[];
  messages?: Message[];
}

export type PromptFormat = 'openai' | 'anthropic';

export function detectFormat(body: unknown, url: string): PromptFormat | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages)) return null;

  const lowerUrl = url.toLowerCase();
  if ('system' in b || lowerUrl.includes('/messages')) return 'anthropic';
  if (b.model !== undefined || lowerUrl.includes('/chat/completions')) return 'openai';
  return null;
}

function str(v: unknown): string { return typeof v === 'string' ? v : ''; }
function rec(v: unknown): Record<string, unknown> { return (v && typeof v === 'object') ? v as Record<string, unknown> : {}; }

function h(level: number): string { return '#'.repeat(Math.min(level, 6)); }

/** 将文本中已有的 markdown 标题向下偏移 offset 层 */
function offsetHeadings(text: string, offset: number): string {
  if (offset <= 0) return text;
  return text.replace(/^(#{1,6})(?= )/gm, (_, hashes: string) => {
    return '#'.repeat(Math.min(hashes.length + offset, 6));
  });
}

function renderPart(part: ContentPart, headingLevel: number, textIndex?: number): string {
  const label = part.type === 'text' && textIndex !== undefined ? `Prompts ${textIndex}` : part.type;
  const typeLabel = `${h(headingLevel)} ${label}`;
  if (part.type === 'text') {
    return `${typeLabel}\n\n${offsetHeadings(str(part.text), headingLevel)}`;
  }
  if (part.type === 'image_url') {
    const url = str(rec(part.image_url).url);
    return `${typeLabel}\n\n![image](${url})`;
  }
  if (part.type === 'image') {
    const src = rec(part.source);
    if (src.type === 'base64' && src.data) {
      return `${typeLabel}\n\n![image](data:${src.media_type ?? 'image/png'};base64,${str(src.data)})`;
    }
    if (src.url) return `${typeLabel}\n\n![image](${str(src.url)})`;
    return `${typeLabel}\n\n[图片]`;
  }
  if (part.type === 'thinking') {
    return `${typeLabel}\n\n${offsetHeadings(str(part.thinking), headingLevel)}`;
  }
  if (part.type === 'tool_use') return `${typeLabel}\n\n[工具调用: ${str(part.name)}]`;
  if (part.type === 'tool_result') return `${typeLabel}\n\n[工具结果]`;
  return `${typeLabel}`;
}

function renderContent(content: string | ContentPart[], msgHeadingLevel: number): string {
  if (typeof content === 'string') {
    return offsetHeadings(content, msgHeadingLevel);
  }
  let textCount = 0;
  return content
    .map((part) => {
      const textIndex = part.type === 'text' ? ++textCount : undefined;
      return renderPart(part, msgHeadingLevel + 1, textIndex);
    })
    .join('\n\n');
}

function renderMessage(role: string, content: string | ContentPart[], headingLevel: number): string {
  const body = renderContent(content, headingLevel);
  return `${h(headingLevel)} ${role}\n\n${body}`;
}

function renderTools(tools: unknown[], format: PromptFormat, headingLevel: number): string {
  const toolSections = tools.map((tool) => {
    const t = rec(tool);
    let name: string;
    let description: string;
    let schemaKey: string;
    let schema: unknown;

    if (format === 'openai') {
      const fn = rec(t.function);
      name = str(fn.name) || 'unknown';
      description = str(fn.description);
      schemaKey = 'parameters';
      schema = fn.parameters;
    } else {
      name = str(t.name) || 'unknown';
      description = str(t.description);
      schemaKey = 'input_schema';
      schema = t.input_schema;
    }

    const parts: string[] = [`${h(headingLevel + 1)} ${name}`];
    if (description) parts.push(`${h(headingLevel + 2)} description\n\n${offsetHeadings(description, headingLevel + 2)}`);
    if (schema) parts.push(`${h(headingLevel + 2)} ${schemaKey}\n\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``);
    return parts.join('\n\n');
  });

  return toolSections.join('\n\n');
}

export function extractPrompt(body: unknown, url: string): string | null {
  const format = detectFormat(body, url);
  if (!format) return null;

  const b = body as Record<string, unknown>;
  const sections: string[] = [];

  if (format === 'anthropic') {
    const ab = body as AnthropicBody;
    if (ab.system) {
      const systemBody = renderContent(ab.system, 1);
      sections.push(`# system\n\n${systemBody}`);
    }
    if ((ab.messages ?? []).length > 0) {
      const msgSections = ab.messages!.map(msg => renderMessage(msg.role, msg.content, 2));
      sections.push(`# messages\n\n${msgSections.join('\n\n---\n\n')}`);
    }
  } else {
    const ob = body as OpenAIBody;
    if ((ob.messages ?? []).length > 0) {
      const msgSections = ob.messages!.map(msg => renderMessage(msg.role, msg.content, 2));
      sections.push(`# messages\n\n${msgSections.join('\n\n---\n\n')}`);
    }
  }

  if (Array.isArray(b.tools) && b.tools.length > 0) {
    sections.push(`# tools\n\n${renderTools(b.tools, format, 2)}`);
  }

  return sections.join('\n\n---\n\n');
}
