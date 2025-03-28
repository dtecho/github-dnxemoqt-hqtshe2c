import { useEffect } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { useOrchestrator } from '../contexts/OrchestratorContext';
import { setMemoryFunctions } from '../contexts/OrchestratorContext';

/**
 * This component connects the Memory context to the Orchestrator
 * It only renders when both contexts are available
 */
const MemoryConnector: React.FC = () => {
  const { addMemory, searchMemories } = useMemory();
  const orchestrator = useOrchestrator();
  
  // When this component mounts, both contexts are guaranteed to be initialized
  useEffect(() => {
    // Connect the memory functions to the orchestrator using the setter
    setMemoryFunctions(addMemory);
    
    // Log that the memory system is connected
    orchestrator.logEvent({
      type: 'system_event',
      description: 'Memory system connected to orchestrator',
      component: 'memory_connector'
    });
    
    // Create a global function to access memory from anywhere
    const globalMemory = {
      addMemory,
      searchMemories,
      saveViaOrchestrator: (content: any, tags: string[]) => {
        return orchestrator.saveToMemory(content, tags);
      }
    };
    
    // @ts-ignore - Adding to window
    window.DeepTreeEchoMemory = globalMemory;
    
    return () => {
      // @ts-ignore - Cleanup
      delete window.DeepTreeEchoMemory;
    };
  }, [addMemory, searchMemories]); // Only re-run when these functions change
  
  // This component doesn't render anything
  return null;
};

export default MemoryConnector;