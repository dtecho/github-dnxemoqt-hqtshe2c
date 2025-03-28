import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

export interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  theme = 'vs-dark',
  options = {},
  onMount
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const valueRef = useRef(value);

  // Keep track of the current value to avoid unnecessary updates
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Default options for VSCode-like experience
    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      automaticLayout: true,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
      fontSize: 14,
      lineHeight: 21,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      padding: { top: 10 },
      folding: true,
      showFoldingControls: 'always',
      wordWrap: 'on',
      fixedOverflowWidgets: true,
    };

    // Create editor instance
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme,
      ...defaultOptions,
      ...options
    });

    // Store editor reference
    editorRef.current = editor;

    // Set up change handler
    const changeModelDisposable = editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      valueRef.current = newValue;
      onChange(newValue);
    });

    // Add VSCode-like commands
    editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
      ],
      run: (ed) => {
        ed.getAction('editor.action.formatDocument')?.run();
      }
    });

    editor.addAction({
      id: 'quick-command',
      label: 'Show Command Palette',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP
      ],
      run: () => {
        // This would show a command palette in a real implementation
        console.log('Command palette requested');
      }
    });

    // Call onMount callback if provided
    if (onMount) {
      onMount(editor);
    }

    // Cleanup on unmount
    return () => {
      changeModelDisposable.dispose();
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Update editor when language or theme changes
  useEffect(() => {
    if (!editorRef.current) return;

    // Update the language model
    const model = editorRef.current.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }

    // Update the theme
    monaco.editor.setTheme(theme);
  }, [language, theme]);

  // Update editor value when prop changes
  useEffect(() => {
    if (!editorRef.current) return;

    // Only update if value is different from current value
    if (value !== valueRef.current) {
      valueRef.current = value;
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update editor options when they change
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions(options);
  }, [options]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      data-testid="monaco-editor-container"
    />
  );
};

export default MonacoEditor;