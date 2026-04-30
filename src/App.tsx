import { useState, useCallback, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { FileDropZone } from './components/FileDropZone';
import { EntryList } from './components/EntryList';
import { RequestPanel } from './components/RequestPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { ThemePicker } from './components/ThemePicker';
import { parseHarFile } from './utils/har-parser';
import { applyTheme, DEFAULT_THEME, type Theme } from './utils/themes';
import type { ParsedEntry } from './types';
import './App.css';

function App() {
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ParsedEntry | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  const handleThemeChange = useCallback((t: Theme) => {
    setTheme(t);
    applyTheme(t);
  }, []);

  useEffect(() => {
    document.body.dataset.themeMode = theme.mode;
  }, [theme.mode]);

  const handleFileLoaded = useCallback((content: string) => {
    try {
      setError(null);
      const parsed = parseHarFile(content);
      setEntries(parsed);
      if (parsed.length > 0) {
        setSelectedEntry(parsed[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse HAR file');
    }
  }, []);

  const handleSelectEntry = useCallback((entry: ParsedEntry) => {
    setSelectedEntry(entry);
    setSelectedPath(null);
    setSelectedValue(null);
  }, []);

  const handleValueSelect = useCallback((path: string, value: string) => {
    setSelectedPath(path);
    setSelectedValue(value);
  }, []);

  if (entries.length === 0) {
    return (
      <div className="app">
        <FileDropZone onFileLoaded={handleFileLoaded} />
        {error && <div className="error-bar">{error}</div>}
      </div>
    );
  }

  const hasSelection = selectedValue !== null;

  const responsePanel = <ResponsePanel entry={selectedEntry} />;

  return (
    <div className="app">
      <div className="app-header">
        <span className="app-title">LLM HTTP Viewer</span>
        <ThemePicker current={theme} onChange={handleThemeChange} />
      </div>
      <div className="app-body">
        <Allotment separator>
          {/* Left pane */}
          <Allotment.Pane minSize={200} preferredSize="35%">
            <Allotment separator vertical>
              <Allotment.Pane minSize={80} preferredSize="50%">
                <EntryList
                  entries={entries}
                  selectedId={selectedEntry?.id ?? null}
                  onSelect={handleSelectEntry}
                />
              </Allotment.Pane>
              <Allotment.Pane minSize={80}>
                <RequestPanel
                  body={selectedEntry?.requestBody ?? null}
                  url={selectedEntry?.url ?? ''}
                  headers={selectedEntry?.requestHeaders ?? []}
                  queryString={selectedEntry?.queryString ?? []}
                  cookies={selectedEntry?.requestCookies ?? []}
                  selectedPath={selectedPath}
                  onValueSelect={handleValueSelect}
                />
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>

          {/* Right pane */}
          <Allotment.Pane minSize={300}>
            {hasSelection ? (
              <Allotment separator vertical>
                <Allotment.Pane minSize={80} preferredSize="67%">
                  <PreviewPanel
                    title="Selected Value"
                    subtitle={selectedPath ?? undefined}
                    content={selectedValue}
                  />
                </Allotment.Pane>
                <Allotment.Pane minSize={80}>
                  {responsePanel}
                </Allotment.Pane>
              </Allotment>
            ) : (
              responsePanel
            )}
          </Allotment.Pane>
        </Allotment>
      </div>
      {error && <div className="error-bar">{error}</div>}
    </div>
  );
}

export default App;
