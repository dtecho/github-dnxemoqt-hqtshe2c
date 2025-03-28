import React, { useState, useEffect } from 'react';
import { 
  FiActivity, FiArrowRight, FiCpu, FiDatabase, 
  FiMap, FiMaximize2, FiMinimize2, FiTerminal,
  FiCode, FiServer, FiMessageSquare
} from 'react-icons/fi';
import { useOrchestrator } from '../contexts/OrchestratorContext';
import { useOrchestratorService } from '../services/orchestratorService';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

interface OrchestrationControlsProps {
  position?: 'top' | 'bottom';
  expanded?: boolean;
}

const OrchestrationControls: React.FC<OrchestrationControlsProps> = ({ 
  position = 'top',
  expanded: initialExpanded = false
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const orchestrator = useOrchestrator();
  const orchestratorService = useOrchestratorService();
  const appStore = useAppStore();
  
  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+O to toggle orchestration controls
      if (e.altKey && e.key === 'o') {
        setExpanded(prev => !prev);
      }
      
      // Alt+M to switch to Map
      if (e.altKey && e.key === 'm') {
        orchestrator.setActiveComponent('map');
      }
      
      // Alt+E to switch to Editor
      if (e.altKey && e.key === 'e') {
        orchestrator.setActiveComponent('editor');
      }
      
      // Alt+T to switch to Terminal
      if (e.altKey && e.key === 't') {
        orchestrator.setActiveComponent('terminal');
      }
      
      // Alt+C to switch to Chat
      if (e.altKey && e.key === 'c') {
        orchestrator.setActiveComponent('chat');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle component selection
  const handleComponentSelect = (component: string) => {
    orchestratorService.navigateTo(component);
  };
  
  // Format health status
  const getHealthColor = () => {
    const status = orchestrator.state.systemHealthStatus.operationalStatus;
    switch (status) {
      case 'optimal': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'impaired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-1/2 transform -translate-x-1/2 z-50`}>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-card/95 backdrop-blur-sm border border-border shadow-lg rounded-lg mb-2"
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Deep Tree Echo Orchestrator</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setShowSystemStatus(!showSystemStatus)}
                    className={`p-1 rounded-md ${showSystemStatus ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                    title="System Status"
                  >
                    <FiActivity size={16} />
                  </button>
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-1 hover:bg-primary/10 rounded-md"
                    title="Minimize"
                  >
                    <FiMinimize2 size={16} />
                  </button>
                </div>
              </div>
              
              {/* Quick Navigation Panel */}
              <div className="mb-3">
                <div className="text-xs text-primary mb-1">Quick Navigation</div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleComponentSelect('map')}
                    className={`p-2 rounded-md flex items-center justify-center ${orchestrator.state.activeComponent === 'map' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                    title="Map View (Alt+M)"
                  >
                    <FiMap size={16} />
                  </button>
                  <button
                    onClick={() => handleComponentSelect('editor')}
                    className={`p-2 rounded-md flex items-center justify-center ${orchestrator.state.activeComponent === 'editor' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                    title="Editor (Alt+E)"
                  >
                    <FiCode size={16} />
                  </button>
                  <button
                    onClick={() => handleComponentSelect('terminal')}
                    className={`p-2 rounded-md flex items-center justify-center ${orchestrator.state.activeComponent === 'terminal' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                    title="Terminal (Alt+T)"
                  >
                    <FiTerminal size={16} />
                  </button>
                  <button
                    onClick={() => handleComponentSelect('chat')}
                    className={`p-2 rounded-md flex items-center justify-center ${orchestrator.state.activeComponent === 'chat' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                    title="Chat (Alt+C)"
                  >
                    <FiMessageSquare size={16} />
                  </button>
                  <button
                    onClick={() => handleComponentSelect('memory')}
                    className={`p-2 rounded-md flex items-center justify-center ${orchestrator.state.activeComponent === 'memory' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                    title="Memory"
                  >
                    <FiDatabase size={16} />
                  </button>
                </div>
              </div>
              
              {/* System Status Display */}
              {showSystemStatus && (
                <div className="mb-3 bg-card/70 rounded-md p-2">
                  <div className="text-xs text-primary mb-1">System Status</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${getHealthColor()} mr-1.5`}></div>
                      <span>Status: {orchestrator.state.systemHealthStatus.operationalStatus}</span>
                    </div>
                    <div>
                      Memory: {orchestrator.state.memoryIntegrationStatus === 'active' ? 
                        <span className="text-green-400">Active</span> : 
                        <span className="text-yellow-400">Inactive</span>}
                    </div>
                    <div>
                      AI: {orchestrator.state.aiIntegrationStatus === 'active' ? 
                        <span className="text-green-400">Active</span> : 
                        <span className="text-yellow-400">Inactive</span>}
                    </div>
                    <div>
                      Editor: {appStore.editorType}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Context Awareness */}
              <div className="text-xs opacity-70">
                <div className="flex space-x-1 items-center">
                  <span>Current Focus:</span>
                  <span className="font-mono">{orchestrator.state.activeComponent}</span>
                  {orchestrator.state.activeComponent === 'map' && (
                    <>
                      <FiArrowRight size={12} />
                      <span className="font-mono">{orchestrator.state.activeRoom}</span>
                    </>
                  )}
                </div>
                {orchestrator.state.activeComponent === 'editor' && appStore.currentFile && (
                  <div className="mt-1">
                    Editing: {appStore.currentFile.name}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!expanded && (
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          onClick={() => setExpanded(true)}
          title="Open Orchestration Controls (Alt+O)"
        >
          <FiCpu size={20} />
        </motion.button>
      )}
    </div>
  );
};

export default OrchestrationControls;