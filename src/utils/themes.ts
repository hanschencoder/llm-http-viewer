import githubLightMd from 'github-markdown-css/github-markdown-light.css?inline';
import githubDarkMd from 'github-markdown-css/github-markdown-dark.css?inline';
import githubDarkDimmedMd from 'github-markdown-css/github-markdown-dark-dimmed.css?inline';

import hljsGithub from 'highlight.js/styles/github.css?inline';
import hljsAtomLight from 'highlight.js/styles/atom-one-light.css?inline';
import hljsXcode from 'highlight.js/styles/xcode.css?inline';
import hljsIdea from 'highlight.js/styles/idea.css?inline';
import hljsGithubDark from 'highlight.js/styles/github-dark.css?inline';
import hljsGithubDarkDimmed from 'highlight.js/styles/github-dark-dimmed.css?inline';
import hljsTokyoNight from 'highlight.js/styles/tokyo-night-dark.css?inline';
import hljsNord from 'highlight.js/styles/nord.css?inline';
import hljsRosePine from 'highlight.js/styles/rose-pine.css?inline';
import hljsAtomDark from 'highlight.js/styles/atom-one-dark.css?inline';
import hljsNightOwl from 'highlight.js/styles/night-owl.css?inline';

export interface Theme {
  id: string;
  label: string;
  mode: 'light' | 'dark';
  markdownCss: string;
  highlightCss: string;
}

export const THEMES: Theme[] = [
  // ── Light ──
  { id: 'github-light',  label: 'GitHub Light', mode: 'light', markdownCss: githubLightMd,       highlightCss: hljsGithub },
  { id: 'atom-light',    label: 'Atom Light',   mode: 'light', markdownCss: githubLightMd,       highlightCss: hljsAtomLight },
  { id: 'xcode',         label: 'Xcode',        mode: 'light', markdownCss: githubLightMd,       highlightCss: hljsXcode },
  { id: 'idea',          label: 'IntelliJ',     mode: 'light', markdownCss: githubLightMd,       highlightCss: hljsIdea },
  // ── Dark ──
  { id: 'github-dark',   label: 'GitHub Dark',  mode: 'dark',  markdownCss: githubDarkMd,        highlightCss: hljsGithubDark },
  { id: 'github-dimmed', label: 'Dimmed',       mode: 'dark',  markdownCss: githubDarkDimmedMd,  highlightCss: hljsGithubDarkDimmed },
  { id: 'tokyo-night',   label: 'Tokyo Night',  mode: 'dark',  markdownCss: githubDarkMd,        highlightCss: hljsTokyoNight },
  { id: 'nord',          label: 'Nord',         mode: 'dark',  markdownCss: githubDarkMd,        highlightCss: hljsNord },
  { id: 'rose-pine',     label: 'Rosé Pine',    mode: 'dark',  markdownCss: githubDarkMd,        highlightCss: hljsRosePine },
  { id: 'one-dark',      label: 'One Dark',     mode: 'dark',  markdownCss: githubDarkMd,        highlightCss: hljsAtomDark },
  { id: 'night-owl',     label: 'Night Owl',    mode: 'dark',  markdownCss: githubDarkMd,        highlightCss: hljsNightOwl },
];

export const DEFAULT_THEME = THEMES[0];

export function applyTheme(theme: Theme) {
  upsertStyle('md-theme', theme.markdownCss);
  upsertStyle('hljs-theme', theme.highlightCss);
}

function upsertStyle(id: string, css: string) {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}
