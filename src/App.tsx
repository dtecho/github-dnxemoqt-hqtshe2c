import { useState, useEffect } from 'react';
import { FiCode, FiTerminal, FiMessageSquare, FiFolder, FiHome } from 'react-icons/fi';
import SplitPane from '@uiw/react-split';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import FileExplorer from './components/FileExplorer';
import Chat from './components/Chat';
import MapView from './components/MapView';
import { useAppStore } from './store/appStore';
import { MemoryProvider } from './contexts/MemoryContext';
import { OrchestratorProvider } from './contexts/OrchestratorContext';
import MemoryConnector from './components/MemoryConnector';
import OrchestrationControls from './components/OrchestrationControls';
import QuickCommandPalette from './components/QuickCommandPalette';

function App() {
  const [activePanel, setActivePanel] = useState<string>('map');
  const [sidebarOpen] = useState<boolean>(true); // setSidebarOpen preserved for future UI controls
  const { theme } = useAppStore();
  const [chatVisible, setChatVisible] = useState<boolean>(false);
  const [terminalVisible, setTerminalVisible] = useState<boolean>(true);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <MemoryProvider>
      <OrchestratorProvider>
        <MemoryConnector />
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
          {sidebarOpen && (
            <aside className="w-14 bg-card border-r border-border flex flex-col items-center py-4 space-y-6">
              <button
                onClick={() => setActivePanel('map')}
                className={`p-2 rounded-md hover:bg-primary/20 transition-colors ${
                  activePanel === 'map' ? 'text-primary' : 'text-foreground'
                }`}
              >
                <FiHome size={24} />
              </button>
              <button
                onClick={() => setActivePanel('files')}
                className={`p-2 rounded-md hover:bg-primary/20 transition-colors ${
                  activePanel === 'files' ? 'text-primary' : 'text-foreground'
                }`}
              >
                <FiFolder size={24} />
              </button>
              <button
                onClick={() => setActivePanel('editor')}
                className={`p-2 rounded-md hover:bg-primary/20 transition-colors ${
                  activePanel === 'editor' ? 'text-primary' : 'text-foreground'
                }`}
              >
                <FiCode size={24} />
              </button>
              <button
                onClick={() => setTerminalVisible(!terminalVisible)}
                className={`p-2 rounded-md hover:bg-primary/20 transition-colors ${
                  terminalVisible ? 'text-primary' : 'text-foreground'
                }`}
              >
                <FiTerminal size={24} />
              </button>
              <button
                onClick={() => setChatVisible(!chatVisible)}
                className={`p-2 rounded-md hover:bg-primary/20 transition-colors ${
                  chatVisible ? 'text-primary' : 'text-foreground'
                }`}
              >
                <FiMessageSquare size={24} />
              </button>
            </aside>
          )}

          <div className="flex-1 flex h-full">
            <SplitPane
              mode="horizontal"
              style={{ height: '100%', width: '100%' }}
            >
              {/* Left side - Chat panel (if visible) */}
              {chatVisible && (
                <div style={{ width: '350px', minWidth: '250px', maxWidth: '450px' }} className="h-full border-r border-border">
                  <Chat />
                </div>
              )}
              
              {/* Right side - Content + Terminal */}
              <div className="flex-1 h-full">
                <SplitPane
                  mode="vertical"
                  style={{ height: '100%' }}
                >
                  {/* Top area - Content Area */}
                  <div style={{ height: 'calc(100% - 200px)', minHeight: '60%' }} className="w-full">
                    {activePanel === 'editor' && <Editor />}
                    {activePanel === 'files' && <FileExplorer />}
                    {activePanel === 'map' && <MapView />}
                  </div>
                  
                  {/* Bottom area - Terminal (if visible) */}
                  {terminalVisible && (
                    <div style={{ height: '200px', minHeight: '10%', maxHeight: '40%' }} className="w-full">
                      <Terminal />
                    </div>
                  )}
                </SplitPane>
              </div>
            </SplitPane>
          </div>
          
          {/* Orchestration UI components */}
          <OrchestrationControls position="bottom" />
          <QuickCommandPalette />
        </div>
      </OrchestratorProvider>
    </MemoryProvider>
  );
}

export default App;