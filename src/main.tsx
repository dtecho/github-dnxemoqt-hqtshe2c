// Define self and window for Monaco Editor workers
(window as any).self = window;
(window as any).MonacoEnvironment = {
  getWorkerUrl: function(_moduleId: string, label: string) {
    const workers = {
      json: '/monaco-editor/esm/vs/language/json/json.worker',
      css: '/monaco-editor/esm/vs/language/css/css.worker',
      html: '/monaco-editor/esm/vs/language/html/html.worker',
      typescript: '/monaco-editor/esm/vs/language/typescript/ts.worker',
      javascript: '/monaco-editor/esm/vs/language/typescript/ts.worker',
      default: '/monaco-editor/esm/vs/editor/editor.worker'
    };

    return new URL(
      workers[label as keyof typeof workers] || workers.default,
      import.meta.url
    ).href;
  }
};

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)