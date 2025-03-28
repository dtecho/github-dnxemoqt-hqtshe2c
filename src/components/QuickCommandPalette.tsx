import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiCommand, FiCode, FiTerminal, 
  FiEdit, FiDatabase, FiMap, FiMessageSquare,
  FiSave, FiRefreshCw
} from 'react-icons/fi';
import { useOrchestrator } from '../contexts/OrchestratorContext';
import { useOrchestratorService } from '../services/orchestratorService';
import { useAppStore } from '../store/appStore';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  shortcut?: string;
}

const QuickCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);
  
  const orchestrator = useOrchestrator();
  const orchestratorService = useOrchestratorService();
  const appStore = useAppStore();
  
  // Listen for keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P or Cmd+P to open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        
        if (!isOpen) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  // Generate commands based on current application state
  useEffect(() => {
    const navigationCommands: Command[] = [
      {
        id: 'nav_map',
        title: 'Go to Map View',
        description: 'Navigate to the Echo Home map',
        icon: <FiMap />,
        action: () => {
          orchestrator.setActiveComponent('map');
          setIsOpen(false);
        },
        category: 'Navigation',
        shortcut: 'Alt+M'
      },
      {
        id: 'nav_editor',
        title: 'Go to Editor',
        description: 'Navigate to the code editor',
        icon: <FiCode />,
        action: () => {
          orchestrator.setActiveComponent('editor');
          setIsOpen(false);
        },
        category: 'Navigation',
        shortcut: 'Alt+E'
      },
      {
        id: 'nav_terminal',
        title: 'Go to Terminal',
        description: 'Navigate to the terminal',
        icon: <FiTerminal />,
        action: () => {
          orchestrator.setActiveComponent('terminal');
          setIsOpen(false);
        },
        category: 'Navigation',
        shortcut: 'Alt+T'
      },
      {
        id: 'nav_chat',
        title: 'Go to Chat',
        description: 'Navigate to the AI chat interface',
        icon: <FiMessageSquare />,
        action: () => {
          orchestrator.setActiveComponent('chat');
          setIsOpen(false);
        },
        category: 'Navigation',
        shortcut: 'Alt+C'
      },
      {
        id: 'nav_memory',
        title: 'Go to Memory System',
        description: 'Navigate to the memory management interface',
        icon: <FiDatabase />,
        action: () => {
          orchestrator.setActiveComponent('memory');
          setIsOpen(false);
        },
        category: 'Navigation'
      }
    ];
    
    // Add room navigation commands
    if (orchestrator.state.activeComponent === 'map') {
      navigationCommands.push(
        {
          id: 'nav_room_memory',
          title: 'Go to Memory Library Room',
          icon: <FiDatabase />,
          action: () => {
            orchestrator.navigateToRoom('memory-library');
            setIsOpen(false);
          },
          category: 'Room Navigation'
        },
        {
          id: 'nav_room_workshop',
          title: 'Go to Workshop Room',
          icon: <FiCode />,
          action: () => {
            orchestrator.navigateToRoom('workshop');
            setIsOpen(false);
          },
          category: 'Room Navigation'
        },
        {
          id: 'nav_room_communications',
          title: 'Go to Communications Hub',
          icon: <FiMessageSquare />,
          action: () => {
            orchestrator.navigateToRoom('communications-hub');
            setIsOpen(false);
          },
          category: 'Room Navigation'
        }
      );
    }
    
    // Editor commands
    const editorCommands: Command[] = [];
    if (appStore.currentFile) {
      editorCommands.push({
        id: 'editor_toggle',
        title: `Switch to ${appStore.editorType === 'monaco' ? 'CodeMirror' : 'Monaco'} Editor`,
        icon: <FiRefreshCw />,
        action: () => {
          appStore.setEditorType(appStore.editorType === 'monaco' ? 'codemirror' : 'monaco');
          setIsOpen(false);
        },
        category: 'Editor'
      });
    }
    
    // System commands
    const systemCommands: Command[] = [
      {
        id: 'system_refresh',
        title: 'Refresh System Context',
        description: 'Update and synchronize all component states',
        icon: <FiRefreshCw />,
        action: () => {
          orchestrator.refreshSystemContext();
          setIsOpen(false);
        },
        category: 'System'
      },
      {
        id: 'system_health',
        title: 'Perform Health Check',
        description: 'Run a system health diagnostic',
        icon: <FiRefreshCw />,
        action: () => {
          orchestrator.performHealthCheck();
          setIsOpen(false);
        },
        category: 'System'
      }
    ];
    
    // Combine all command types
    setCommands([
      ...navigationCommands,
      ...editorCommands,
      ...systemCommands
    ]);
  }, [orchestrator.state.activeComponent, appStore.currentFile, appStore.editorType]);
  
  // Filter commands based on search
  useEffect(() => {
    if (!search) {
      setFilteredCommands(commands);
      setSelectedIndex(0);
      return;
    }
    
    const lowercaseSearch = search.toLowerCase();
    const filtered = commands.filter(cmd => 
      cmd.title.toLowerCase().includes(lowercaseSearch) ||
      (cmd.description && cmd.description.toLowerCase().includes(lowercaseSearch)) ||
      cmd.category.toLowerCase().includes(lowercaseSearch)
    );
    
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [search, commands]);
  
  // Handle arrow key navigation and command execution
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : prev
      );
      ensureSelectedIsVisible();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      ensureSelectedIsVisible();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };
  
  // Ensure the selected command is visible in the scroll view
  const ensureSelectedIsVisible = () => {
    if (commandListRef.current) {
      const selectedElement = commandListRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  };
  
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh]"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-card border border-border rounded-lg shadow-xl w-full max-w-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center">
                <FiSearch className="mr-2 text-primary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands, rooms, or actions..."
                  className="flex-1 bg-transparent border-none outline-none"
                  autoFocus
                />
                <div className="text-xs opacity-50 flex items-center">
                  <FiCommand className="mr-1" />
                  <span>P</span>
                </div>
              </div>
              
              <div
                ref={commandListRef}
                className="overflow-y-auto max-h-[60vh]"
              >
                {filteredCommands.length === 0 ? (
                  <div className="p-4 text-center opacity-70">
                    No commands found
                  </div>
                ) : (
                  filteredCommands.map((command, index) => (
                    <div
                      key={command.id}
                      data-index={index}
                      className={`p-3 flex items-center hover:bg-primary/10 cursor-pointer ${
                        selectedIndex === index ? 'bg-primary/20' : ''
                      }`}
                      onClick={() => command.action()}
                    >
                      <div className={`p-2 rounded-md ${selectedIndex === index ? 'bg-primary/30 text-primary' : 'bg-card/50'} mr-3`}>
                        {command.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{command.title}</div>
                        {command.description && (
                          <div className="text-xs opacity-70">{command.description}</div>
                        )}
                        <div className="text-xs opacity-50 mt-1">{command.category}</div>
                      </div>
                      {command.shortcut && (
                        <div className="text-xs bg-card/50 px-2 py-1 rounded opacity-70">
                          {command.shortcut}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-border text-xs opacity-70">
                <div className="flex justify-between">
                  <span>
                    Press ↑↓ to navigate, Enter to select
                  </span>
                  <span>
                    {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary/90 hover:bg-primary text-white p-2 rounded-md shadow-lg flex items-center"
          title="Command Palette (Ctrl+P or Cmd+P)"
        >
          <FiCommand className="mr-1" />
          <span>Commands</span>
        </button>
      </div>
    </>
  );
};

export default QuickCommandPalette;