import React, { useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: 'light' | 'dark';
  height?: string;
  width?: string;
  className?: string;
  readOnly?: boolean;
  lineNumbers?: boolean;
  editorWillMount?: () => void;
  editorDidMount?: (editor: any) => void;
  options?: Record<string, any>;
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  theme = 'dark',
  height = '100%',
  width = '100%',
  className = '',
  readOnly = false,
  lineNumbers = true,
  editorWillMount,
  editorDidMount,
  options = {},
}) => {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Map file extensions to CodeMirror language extensions
  const getLanguageExtension = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js':
        return javascript({ jsx: true });
      case 'typescript':
      case 'ts':
        return javascript({ jsx: true, typescript: true });
      case 'tsx':
        return javascript({ jsx: true, typescript: true });
      case 'jsx':
        return javascript({ jsx: true });
      case 'html':
        return html();
      case 'css':
        return css();
      case 'json':
        return json();
      case 'markdown':
      case 'md':
        return markdown();
      default:
        return javascript();
    }
  };

  // Call editorWillMount before rendering
  useEffect(() => {
    if (editorWillMount) {
      editorWillMount();
    }
  }, [editorWillMount]);

  // Call editorDidMount after rendering and handle cleanup
  useEffect(() => {
    // We need to check if the editor component is properly mounted
    // before attempting to access its internals
    if (editorDidMount && editorRef.current) {
      editorDidMount(editorRef.current);
    }
    
    // Cleanup function
    return () => {
      // Any editor-specific cleanup if needed
      editorRef.current = null;
    };
  }, [editorDidMount]);

  const handleChange = (value: string) => {
    onChange(value);
  };

  // Create an array of extensions for the editor
  const langExtension = getLanguageExtension(language);
  
  // Set up the extensions array with the language extension
  const extensions = [langExtension];
  
  // Add theme extension if using dark theme
  const themeOption = theme === 'dark' ? { theme: oneDark } : {};

  return (
    <div
      ref={containerRef}
      style={{ height, width }}
      className={`code-mirror-wrapper ${className}`}
    >
      <CodeMirror
        value={value}
        onChange={handleChange}
        height={height}
        extensions={extensions}
        {...themeOption}
        basicSetup={{
          lineNumbers,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        editable={!readOnly}
        {...options}
      />
    </div>
  );
};

export default CodeMirrorEditor;