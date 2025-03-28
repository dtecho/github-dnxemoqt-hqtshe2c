import { useState, useEffect } from 'react';
import { 
  FiActivity, FiCpu, FiServer, FiZap, 
  FiMemory, FiDatabase, FiAlertTriangle,
  FiCheck, FiX
} from 'react-icons/fi';
import { useOrchestrator } from '../contexts/OrchestratorContext';
import { motion } from 'framer-motion';

interface SystemMonitorProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ 
  compact = false,
  showDetails = true,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(!compact);
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'connections' | 'events'>('overview');
  const orchestrator = useOrchestrator();
  const [eventsToShow, setEventsToShow] = useState(5);
  
  // Refresh system status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      orchestrator.performHealthCheck();
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Health status styling
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'impaired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  // Compact view
  if (compact) {
    return (
      <div className={`bg-card text-card-foreground border border-border rounded-md p-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiServer className={getStatusColor(orchestrator.state.systemHealthStatus.operationalStatus)} />
            <span className="text-sm">System Status</span>
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(orchestrator.state.systemHealthStatus.operationalStatus)} mr-1`}></div>
            <span className="text-xs">{orchestrator.state.systemHealthStatus.operationalStatus}</span>
            <button
              onClick={() => setExpanded(true)}
              className="ml-2 p-1 hover:bg-primary/10 rounded"
            >
              <FiActivity size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-card text-card-foreground border border-border rounded-md ${className}`}>
      <div className="flex justify-between items-center p-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <FiServer className={getStatusColor(orchestrator.state.systemHealthStatus.operationalStatus)} />
          <span className="font-medium">Deep Tree Echo System Monitor</span>
        </div>
        <div className="flex space-x-2">
          {expanded ? (
            <button
              onClick={() => setExpanded(false)}
              className="p-1 hover:bg-primary/10 rounded"
              title="Collapse"
            >
              <FiX size={16} />
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="p-1 hover:bg-primary/10 rounded"
              title="Expand"
            >
              <FiActivity size={16} />
            </button>
          )}
        </div>
      </div>
      
      {expanded && (
        <>
          <div className="border-b border-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'hover:bg-primary/5'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('memory')}
                className={`px-4 py-2 text-sm ${activeTab === 'memory' ? 'border-b-2 border-primary text-primary' : 'hover:bg-primary/5'}`}
              >
                Memory
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-4 py-2 text-sm ${activeTab === 'connections' ? 'border-b-2 border-primary text-primary' : 'hover:bg-primary/5'}`}
              >
                Connections
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2 text-sm ${activeTab === 'events' ? 'border-b-2 border-primary text-primary' : 'hover:bg-primary/5'}`}
              >
                Events
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-card/50 rounded-md p-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">System Health</span>
                      <div className={`px-2 py-0.5 text-xs rounded ${
                        orchestrator.state.systemHealthStatus.operationalStatus === 'optimal' ? 'bg-green-500/20 text-green-400' :
                        orchestrator.state.systemHealthStatus.operationalStatus === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {orchestrator.state.systemHealthStatus.operationalStatus}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs opacity-70 mb-1">Memory Usage</div>
                        <div className="h-2 bg-gray-700 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${
                              orchestrator.state.systemHealthStatus.memoryUsage > 80 ? 'bg-red-500' :
                              orchestrator.state.systemHealthStatus.memoryUsage > 60 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${orchestrator.state.systemHealthStatus.memoryUsage}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-xs mt-1">
                          {orchestrator.state.systemHealthStatus.memoryUsage}%
                        </div>
                      </div>
                      
                      <div className="text-xs">
                        <div className="flex justify-between mb-1">
                          <span>Last Health Check:</span>
                          <span>{formatTime(orchestrator.state.systemHealthStatus.lastHealthCheck)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Connections:</span>
                          <span>{orchestrator.state.systemHealthStatus.activeConnections}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card/50 rounded-md p-3">
                    <div className="text-sm font-medium mb-2">Component Status</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <FiDatabase className="mr-1.5" />
                          <span>Memory System</span>
                        </div>
                        <span className={
                          orchestrator.state.memoryIntegrationStatus === 'active' ? 'text-green-400' :
                          orchestrator.state.memoryIntegrationStatus === 'connecting' ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {orchestrator.state.memoryIntegrationStatus}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <FiCpu className="mr-1.5" />
                          <span>AI Integration</span>
                        </div>
                        <span className={
                          orchestrator.state.aiIntegrationStatus === 'active' ? 'text-green-400' :
                          orchestrator.state.aiIntegrationStatus === 'initializing' ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {orchestrator.state.aiIntegrationStatus}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <FiZap className="mr-1.5" />
                          <span>Terminal</span>
                        </div>
                        <span className={
                          orchestrator.state.terminalStatus === 'ready' ? 'text-green-400' :
                          orchestrator.state.terminalStatus === 'busy' ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {orchestrator.state.terminalStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card/50 rounded-md p-3">
                  <div className="text-sm font-medium mb-2">Current Context</div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span>Active Component:</span>
                      <span className="font-mono">{orchestrator.state.activeComponent}</span>
                    </div>
                    
                    {orchestrator.state.activeComponent === 'map' && (
                      <div className="flex justify-between">
                        <span>Current Room:</span>
                        <span className="font-mono">{orchestrator.state.activeRoom}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Theme:</span>
                      <span>{orchestrator.state.currentTheme}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Last Activity:</span>
                      <span>{orchestrator.state.lastUserAction} ({formatTime(orchestrator.state.lastUserActionTimestamp)})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'memory' && (
              <div>
                <div className="bg-card/50 rounded-md p-3 mb-4">
                  <div className="text-sm font-medium mb-2">Memory System Status</div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span>Integration Status:</span>
                      <span className={
                        orchestrator.state.memoryIntegrationStatus === 'active' ? 'text-green-400' :
                        orchestrator.state.memoryIntegrationStatus === 'connecting' ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {orchestrator.state.memoryIntegrationStatus}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Last Memory Operation:</span>
                      <span>
                        {orchestrator.state.sessionHistory
                          .filter(e => e.type === 'memory_operation')
                          .slice(-1)[0]?.description || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm font-medium mb-2">Recent Memory Operations</div>
                <div className="space-y-2">
                  {orchestrator.state.sessionHistory
                    .filter(e => e.type === 'memory_operation')
                    .slice(-5)
                    .map(event => (
                      <div key={event.id} className="bg-card/30 p-2 rounded-md text-xs">
                        <div className="flex justify-between mb-1">
                          <span>{event.description}</span>
                          <span className="opacity-70">{formatTime(event.timestamp)}</span>
                        </div>
                        <div className="opacity-70">
                          Component: {event.component}
                        </div>
                      </div>
                    ))}
                    
                  {orchestrator.state.sessionHistory.filter(e => e.type === 'memory_operation').length === 0 && (
                    <div className="text-xs opacity-70 text-center p-2">
                      No memory operations recorded
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'connections' && (
              <div>
                <div className="bg-card/50 rounded-md p-3 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Active Connections</span>
                    <span className="text-xs opacity-70">
                      {orchestrator.state.systemHealthStatus.activeConnections} connections
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-md bg-card/30">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                        <span>Map View</span>
                      </div>
                      <span className="text-green-400">Connected</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 rounded-md bg-card/30">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                        <span>Editor</span>
                      </div>
                      <span className="text-green-400">Connected</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 rounded-md bg-card/30">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                        <span>Terminal</span>
                      </div>
                      <span className="text-green-400">Connected</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 rounded-md bg-card/30">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                        <span>Memory System</span>
                      </div>
                      <span className={
                        orchestrator.state.memoryIntegrationStatus === 'active' ? 'text-green-400' :
                        orchestrator.state.memoryIntegrationStatus === 'connecting' ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {orchestrator.state.memoryIntegrationStatus}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 rounded-md bg-card/30">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                        <span>AI System</span>
                      </div>
                      <span className={
                        orchestrator.state.aiIntegrationStatus === 'active' ? 'text-green-400' :
                        orchestrator.state.aiIntegrationStatus === 'initializing' ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {orchestrator.state.aiIntegrationStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between mb-2">
                  <div className="text-sm font-medium">System Events</div>
                  <select
                    value={eventsToShow}
                    onChange={(e) => setEventsToShow(Number(e.target.value))}
                    className="text-xs bg-card/50 border border-border rounded p-1"
                  >
                    <option value={5}>Last 5</option>
                    <option value={10}>Last 10</option>
                    <option value={20}>Last 20</option>
                    <option value={50}>Last 50</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  {orchestrator.state.sessionHistory.slice(-eventsToShow).reverse().map(event => (
                    <div key={event.id} className="bg-card/30 p-2 rounded-md text-xs">
                      <div className="flex justify-between mb-1">
                        <span className={`
                          ${event.type === 'system_event' ? 'text-blue-400' : ''}
                          ${event.type === 'navigation' ? 'text-green-400' : ''}
                          ${event.type === 'file_operation' ? 'text-yellow-400' : ''}
                          ${event.type === 'memory_operation' ? 'text-purple-400' : ''}
                          ${event.type === 'ai_interaction' ? 'text-cyan-400' : ''}
                        `}>
                          {event.type.replace('_', ' ')}
                        </span>
                        <span className="opacity-70">{formatTime(event.timestamp)}</span>
                      </div>
                      <div className="mb-1">{event.description}</div>
                      <div className="opacity-70">
                        Component: {event.component}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-border p-2 text-xs opacity-70 flex justify-between">
            <span>Deep Tree Echo Monitoring System</span>
            <span>
              Last Updated: {formatTime(orchestrator.state.systemHealthStatus.lastHealthCheck)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemMonitor;