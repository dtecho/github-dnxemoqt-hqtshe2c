import React, { useState, useEffect } from 'react';
import EchoHomeMap, { RoomType } from './EchoHomeMap';
import { FiHome, FiMessageCircle, FiSettings, FiDatabase, FiActivity } from 'react-icons/fi';
import Chat from './Chat';
import Mem0AI from './Mem0AI';
import ArchitectureDiagrams from './ArchitectureDiagrams';
import { useOrchestrator } from '../contexts/OrchestratorContext';

/**
 * MapView component - Combines the EchoHomeMap with functionality panels
 * based on selected rooms/features
 */
const MapView: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('overview');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showMemory, setShowMemory] = useState<boolean>(false);
  const [showDiagrams, setShowDiagrams] = useState<boolean>(false);
  const orchestrator = useOrchestrator();
  
  // Sync with orchestrator state
  useEffect(() => {
    setSelectedRoom(orchestrator.state.activeRoom);
  }, [orchestrator.state.activeRoom]);
  
  // Report room changes to orchestrator
  useEffect(() => {
    orchestrator.logEvent({
      type: 'navigation',
      description: `Viewing room: ${selectedRoom}`,
      component: 'map'
    });
  }, [selectedRoom, orchestrator]);

  // Handle room selection
  const handleRoomSelect = (roomId: RoomType) => {
    setSelectedRoom(roomId);
    orchestrator.navigateToRoom(roomId);
    
    // Automatically show chat when communications hub is selected
    if (roomId === 'communications-hub') {
      setShowChat(true);
    }
    // Automatically show memory system when memory library is selected
    if (roomId === 'memory-library') {
      setShowMemory(true);
    }
    // Automatically show architecture diagrams when visualization studio is selected
    if (roomId === 'visualization-studio') {
      setShowDiagrams(true);
    }
  };

  // Toggle chat visibility
  const toggleChat = () => {
    setShowChat(!showChat);
  };

  // Toggle memory system visibility
  const toggleMemory = () => {
    setShowMemory(!showMemory);
  };

  // Toggle architecture diagrams visibility
  const toggleDiagrams = () => {
    setShowDiagrams(!showDiagrams);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Toolbar */}
      <div className="flex-none h-12 bg-card text-card-foreground px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center">
          <button
            onClick={() => handleRoomSelect('overview')}
            className={`p-2 rounded-md transition-colors ${
              selectedRoom === 'overview' ? 'text-primary' : 'hover:bg-primary/20'
            }`}
          >
            <FiHome size={20} />
          </button>
          <span className="ml-2 font-medium">Deep Tree Echo Home</span>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={toggleMemory}
            className={`p-2 rounded-md transition-colors ${
              showMemory ? 'text-primary' : 'hover:bg-primary/20'
            }`}
            title="Memory System"
          >
            <FiDatabase size={20} />
          </button>
          <button
            onClick={toggleChat}
            className={`p-2 rounded-md transition-colors ${
              showChat ? 'text-primary' : 'hover:bg-primary/20'
            }`}
            title="Chat"
          >
            <FiMessageCircle size={20} />
          </button>
          <button
            onClick={toggleDiagrams}
            className={`p-2 rounded-md transition-colors ${
              showDiagrams ? 'text-primary' : 'hover:bg-primary/20'
            }`}
            title="Architecture Diagrams"
          >
            <FiActivity size={20} />
          </button>
          <button className="p-2 rounded-md hover:bg-primary/20 transition-colors ml-1">
            <FiSettings size={20} />
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Panel */}
        <div className={`${showChat || showMemory || showDiagrams ? 'w-1/2' : 'w-full'} h-full transition-all duration-300`}>
          <EchoHomeMap onRoomSelect={handleRoomSelect} />
        </div>
        
        {/* Right Panel - Chat, Memory, or Diagrams */}
        {(showChat || showMemory || showDiagrams) && (
          <div className="w-1/2 h-full border-l border-border">
            {showMemory && (
              <div className={`h-full ${(showChat || showDiagrams) ? 'h-1/2' : 'h-full'}`}>
                <Mem0AI />
              </div>
            )}
            
            {showChat && (
              <div className={`${showMemory ? 'h-1/2 border-t border-border' : 'h-full'}`}>
                <Chat />
              </div>
            )}
            
            {showDiagrams && (
              <div className={`${showMemory || showChat ? 'h-1/2 border-t border-border' : 'h-full'}`}>
                <ArchitectureDiagrams />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;