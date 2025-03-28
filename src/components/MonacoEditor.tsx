import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';

export interface MonacoEditorProps {
  width?: string | number;
  height?: string | number;
  language?: string;
  theme?: string;
  value?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onChange?: (value: string) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

// VSCodium themes
const vscodiumThemes = {
  'vscodium-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorCursor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2c313a',
      'editorLineNumber.foreground': '#858585',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
      'editorIndentGuide.background': '#404040',
    }
  },
  'vscodium-light': {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editorCursor.foreground': '#000000',
      'editor.lineHighlightBackground': '#f5f5f5',
      'editorLineNumber.foreground': '#237893',
      'editor.selectionBackground': '#add6ff',
      'editor.inactiveSelectionBackground': '#e5ebf1',
      'editorIndentGuide.background': '#d3d3d3',
    }
  }
};

/**
 * A custom Monaco Editor component that directly integrates with monaco-editor
 * with VSCodium-like styling and features
 */
export const MonacoEditor = ({
  width = '100%',
  height = '100%',
  language = 'javascript',
  theme = 'vscodium-dark',
  value = '',
  options = {},
  onChange,
  onMount
}: MonacoEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const valueRef = useRef(value);
  
  // Register VSCodium themes
  useEffect(() => {
    try {
      Object.entries(vscodiumThemes).forEach(([themeName, themeData]) => {
        monaco.editor.defineTheme(themeName, themeData as monaco.editor.IStandaloneThemeData);
      });
    } catch (err) {
      console.error('Error defining themes:', err);
    }
  }, []);
  
  // Keep track of the current value to avoid unnecessary updates
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Initialize the editor
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Create editor instance with VSCodium-like defaults
      const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        automaticLayout: true,
        fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 21,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        padding: {
          top: 10,
        },
        folding: true,
        showFoldingControls: 'always',
        wordWrap: 'on',
        fixedOverflowWidgets: true,
      };
      
      // Safety check to prevent errors if monaco isn't fully loaded yet
      if (!monaco || !monaco.editor) {
        console.warn('Monaco editor not loaded yet, retrying...');
        setTimeout(() => {
          setIsEditorReady(prev => !prev); // Toggle to trigger useEffect again
        }, 500);
        return;
      }
      
      const editor = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme,
        ...defaultOptions,
        ...options
      });
      
      // Store the editor reference and mark as ready
      editorRef.current = editor;
      setIsEditorReady(true);
      
      // Set up change handler
      const changeModelDisposable = editor.onDidChangeModelContent(() => {
        const newValue = editor.getValue();
        valueRef.current = newValue;
        onChange?.(newValue);
      });
      
      // Add VSCodium-like commands
      editor.addAction({
        id: 'vscodium-format-document',
        label: 'Format Document',
        keybindings: [
          monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
        ],
        run: (ed) => {
          ed.getAction('editor.action.formatDocument')?.run();
        }
      });
      
      editor.addAction({
        id: 'vscodium-quick-command',
        label: 'Show Command Palette',
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP
        ],
        run: (ed) => {
          // This would show a command palette in a real implementation
          console.log('Command palette requested');
        }
      });
      
      // Notify when mounted
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
    } catch (error) {
      console.error('Error initializing monaco editor:', error);
    }
  }, []);
  
  // Update editor when language or theme changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    try {
      // Update the language model
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
      
      // Update the theme
      monaco.editor.setTheme(theme);
    } catch (error) {
      console.error('Error updating language or theme:', error);
    }
  }, [language, theme]);
  
  // Update editor value when prop changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    try {
      // Only update the value if it's different from the current value
      // and if it's not the same as what was set by the user
      if (value !== valueRef.current) {
        valueRef.current = value;
        editorRef.current.setValue(value);
      }
    } catch (error) {
      console.error('Error updating editor value:', error);
    }
  }, [value]);
  
  // Update editor options when they change
  useEffect(() => {
    if (!editorRef.current) return;
    
    try {
      editorRef.current.updateOptions(options);
    } catch (error) {
      console.error('Error updating editor options:', error);
    }
  }, [options]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        overflow: 'hidden'
      }}
      data-testid="monaco-editor-container"
      className="vscodium-editor-container"
    />
  );
};

export default MonacoEditor;