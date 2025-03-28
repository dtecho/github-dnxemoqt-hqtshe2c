import { useEffect, useRef, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { FiSettings, FiCode, FiCopy, FiDownload, FiShare2, FiExternalLink, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { useAppStore } from '../store/appStore';
import { useMemory } from '../contexts/MemoryContext';
import { MonacoEditor } from './MonacoEditor';
import CodeMirrorEditor from './CodeMirrorEditor';
import { openInStackBlitz } from '../services/stackblitzService';

// Available editor themes
const editorThemes = [
  { id: 'vscodium-dark', name: 'VSCodium Dark' },
  { id: 'vscodium-light', name: 'VSCodium Light' },
  { id: 'vs-dark', name: 'VS Dark' },
  { id: 'vs-light', name: 'VS Light' },
  { id: 'hc-black', name: 'High Contrast Dark' },
  { id: 'hc-light', name: 'High Contrast Light' },
];

const Editor = () => {
  const { currentFile, updateFile, files, theme: appTheme, editorType, setEditorType } = useAppStore();
  const [editorContent, setEditorContent] = useState<string>('');
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorTheme, setEditorTheme] = useState<string>('vscodium-dark');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const { addMemory } = useMemory();
  const [isStackBlitzLoading, setIsStackBlitzLoading] = useState(false);
  
  // Update editor content when current file changes
  useEffect(() => {
    if (currentFile) {
      setEditorContent(currentFile.content);
    } else {
      setEditorContent('// Select a file to edit or create a new one');
    }
  }, [currentFile]);

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    if (currentFile) {
      updateFile(currentFile.id, value);
    }
  };

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
    
    // Set up advanced features like code folding, minimap, etc.
    editor.updateOptions({
      folding: true,
      showFoldingControls: 'always',
      matchBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
    });
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (currentFile) {
        // Save explicitly - in this case we're already auto-saving, but we could add feedback
        console.log('File saved:', currentFile.name);
      }
    });

    // Set up more advanced keyboard shortcuts for productivity (VSCodium-like)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.getAction('actions.find')?.run();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      // This would normally open a file picker dialog in VSCodium
      console.log('File picker requested');
    });
  };

  // Get language based on file extension
  const getLanguage = () => {
    if (!currentFile) return 'javascript';
    
    const extension = currentFile.name.split('.').pop()?.toLowerCase();
    switch(extension) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      default: return 'javascript';
    }
  };

  // Save to Deep Tree Echo's memory system
  const saveToMemory = useCallback(() => {
    if (currentFile && editorContent.trim()) {
      addMemory({
        title: `Code: ${currentFile.name}`,
        content: editorContent,
        tags: ['code', getLanguage(), currentFile.name.split('.').pop() || ''],
      });
    }
  }, [currentFile, editorContent, addMemory, getLanguage]);

  // Copy to clipboard functionality
  const copyToClipboard = () => {
    if (editorContent) {
      navigator.clipboard.writeText(editorContent);
    }
  };

  // Download file functionality
  const downloadFile = () => {
    if (currentFile && editorContent) {
      const blob = new Blob([editorContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Open current project in StackBlitz
  const openProjectInStackBlitz = async () => {
    if (files.length === 0) return;
    
    try {
      setIsStackBlitzLoading(true);
      await openInStackBlitz(files, {
        newWindow: true,
        openFile: currentFile?.path,
        title: "VSCodium-Like Editor Project",
        description: "Created with Monaco Editor"
      });
    } catch (error) {
      console.error('Failed to open in StackBlitz:', error);
    } finally {
      setIsStackBlitzLoading(false);
    }
  };

  // Toggle between Monaco and CodeMirror editors
  const toggleEditorType = () => {
    setEditorType(editorType === 'monaco' ? 'codemirror' : 'monaco');
  };

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
    fontSize: fontSize,
    wordWrap: 'on',
    automaticLayout: true,
    lineNumbers: 'on',
    rulers: [80, 120],
    bracketPairColorization: { enabled: true },
    formatOnPaste: true,
    formatOnType: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    linkedEditing: true,
    renderLineHighlight: 'all',
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-card text-card-foreground px-4 py-2 border-b border-border flex justify-between items-center">
        <div className="flex items-center">
          <FiCode className="mr-2" />
          <span>{currentFile ? currentFile.name : 'No file selected'}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleEditorType}
            className="p-1 hover:bg-primary/20 rounded-md"
            title={`Switch to ${editorType === 'monaco' ? 'CodeMirror' : 'Monaco'} editor`}
          >
            {editorType === 'monaco' ? 
              <FiToggleLeft size={18} /> : 
              <FiToggleRight size={18} />
            }
          </button>
          <button
            onClick={() => copyToClipboard()}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="Copy to clipboard"
            disabled={!currentFile}
          >
            <FiCopy size={18} />
          </button>
          <button
            onClick={() => downloadFile()}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="Download file"
            disabled={!currentFile}
          >
            <FiDownload size={18} />
          </button>
          <button
            onClick={() => saveToMemory()}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="Save to memory"
            disabled={!currentFile}
          >
            <FiShare2 size={18} />
          </button>
          <button
            onClick={openProjectInStackBlitz}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="Open in StackBlitz"
            disabled={isStackBlitzLoading || files.length === 0}
          >
            {isStackBlitzLoading ? (
              <span className="inline-block animate-spin">↻</span>
            ) : (
              <FiExternalLink size={18} />
            )}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="Editor settings"
          >
            <FiSettings size={18} />
          </button>
        </div>
      </div>
      
      {showSettings && (
        <div className="bg-card/90 p-4 border-b border-border flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Editor Type</label>
            <select
              value={editorType}
              onChange={(e) => setEditorType(e.target.value as 'monaco' | 'codemirror')}
              className="bg-input border border-border rounded px-2 py-1 text-sm w-36"
            >
              <option value="monaco">Monaco Editor</option>
              <option value="codemirror">CodeMirror</option>
            </select>
          </div>
          
          {editorType === 'monaco' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={editorTheme}
                  onChange={(e) => setEditorTheme(e.target.value)}
                  className="bg-input border border-border rounded px-2 py-1 text-sm w-36"
                >
                  {editorThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Font Size</label>
            <input
              type="number"
              min="10"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="bg-input border border-border rounded px-2 py-1 text-sm w-20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Word Wrap</label>
            <select
              defaultValue="on"
              className="bg-input border border-border rounded px-2 py-1 text-sm w-36"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="wordWrapColumn">At Column</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tab Size</label>
            <select
              defaultValue="2"
              className="bg-input border border-border rounded px-2 py-1 text-sm w-20"
            >
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="8">8</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="flex-1">
        {editorType === 'monaco' ? (
          <MonacoEditor
            width="100%"
            height="100%"
            language={getLanguage()}
            theme={editorTheme}
            value={editorContent}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={editorOptions}
          />
        ) : (
          <CodeMirrorEditor
            value={editorContent}
            onChange={handleEditorChange}
            language={getLanguage()}
            theme={appTheme as 'light' | 'dark'}
            height="100%"
            width="100%"
            lineNumbers={true}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;