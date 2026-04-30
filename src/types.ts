export interface HarFile {
  log: HarLog;
}

export interface HarLog {
  version: string;
  creator: { name: string; version: string };
  entries: HarEntry[];
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  timings: HarTimings;
  _resourceType?: string;
}

export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  headers: HarNameValuePair[];
  cookies: HarCookie[];
  queryString: HarNameValuePair[];
  postData?: HarPostData;
  bodySize: number;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HarNameValuePair[];
  cookies: HarCookie[];
  content: HarContent;
  bodySize: number;
  _transferSize?: number;
}

export interface HarPostData {
  mimeType: string;
  text: string;
  params?: HarNameValuePair[];
}

export interface HarContent {
  size: number;
  mimeType: string;
  text?: string;
  encoding?: string;
}

export interface HarNameValuePair {
  name: string;
  value: string;
}

export interface HarTimings {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
}

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
  requestBodySize: number;
  responseBody: string;
  responseBodySize: number;
  responseTransferSize: number;
  responseMimeType: string;
  isStreaming: boolean;
  requestHeaders: HarNameValuePair[];
  responseHeaders: HarNameValuePair[];
  queryString: HarNameValuePair[];
  requestCookies: HarCookie[];
  responseCookies: HarCookie[];
  timings: HarTimings;
}

export interface StreamChunk {
  index: number;
  rawData: string;
  parsedData?: unknown;
  extractedText?: string;
  contentType?: 'thinking' | 'content' | 'tool';
}

export interface StreamParseResult {
  mode: 'sse' | 'raw';
  chunks: StreamChunk[];
  reconstructed: string;
}
