import type { HarFile, HarEntry, ParsedEntry } from '../types';

export function parseHarFile(json: string): ParsedEntry[] {
  const har: HarFile = JSON.parse(json);
  if (!har?.log?.entries) {
    throw new Error('Invalid HAR file: missing log.entries');
  }
  return har.log.entries.map((entry, index) => parseEntry(entry, index));
}

function decodeContent(text: string | undefined, encoding: string | undefined): string {
  if (!text) return '';
  if (encoding === 'base64') {
    try {
      return decodeURIComponent(
        atob(text)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      try { return atob(text); } catch { return text; }
    }
  }
  return text;
}

function parseEntry(entry: HarEntry, index: number): ParsedEntry {
  let requestBody: unknown = undefined;
  if (entry.request.postData?.text) {
    try {
      requestBody = JSON.parse(entry.request.postData.text);
    } catch {
      requestBody = entry.request.postData.text;
    }
  }

  const responseBody = decodeContent(
    entry.response.content.text,
    entry.response.content.encoding
  );
  const isStreaming = detectStreaming(entry, responseBody);

  return {
    id: `entry-${index}`,
    index,
    method: entry.request.method,
    url: entry.request.url,
    status: entry.response.status,
    statusText: entry.response.statusText,
    time: entry.time,
    startedDateTime: entry.startedDateTime,
    httpVersion: entry.request.httpVersion,
    requestBody,
    requestBodySize: entry.request.bodySize,
    responseBody,
    responseBodySize: entry.response.bodySize,
    responseTransferSize: entry.response._transferSize ?? entry.response.bodySize,
    responseMimeType: entry.response.content.mimeType ?? '',
    isStreaming,
    requestHeaders: entry.request.headers,
    responseHeaders: entry.response.headers,
    queryString: entry.request.queryString ?? [],
    requestCookies: entry.request.cookies ?? [],
    responseCookies: entry.response.cookies ?? [],
    timings: entry.timings,
  };
}

function detectStreaming(entry: HarEntry, decodedBody: string): boolean {
  if (/^data:\s/m.test(decodedBody) && decodedBody.includes('\n\n')) {
    return true;
  }
  const url = entry.request.url.toLowerCase();
  if (url.includes('/stream') || url.includes('/chat/completions')) {
    try {
      const req = JSON.parse(entry.request.postData?.text ?? '{}');
      if (req.stream === true) return true;
    } catch { /* ignore */ }
  }
  return false;
}
