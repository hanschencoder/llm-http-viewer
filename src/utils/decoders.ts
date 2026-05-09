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
