import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBook, 
  FiCode, 
  FiCpu, 
  FiDatabase, 
  FiMessageCircle, 
  FiFeather, 
  FiEye,
  FiArrowLeft,
  FiInfo,
  FiSettings
} from 'react-icons/fi';

// Define room types
export type RoomType = 
  | 'memory-library' 
  | 'workshop' 
  | 'visualization-studio' 
  | 'training-hall' 
  | 'observatory' 
  | 'garden' 
  | 'communications-hub'
  | 'overview';

interface Room {
  id: RoomType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  connections: RoomType[];
}

const ROOMS: Room[] = [
  {
    id: 'memory-library',
    name: 'Memory Library',
    description: 'Repository of stored experiences, knowledge, and learned patterns.',
    icon: <FiBook size={24} />,
    color: 'bg-indigo-500',
    position: { x: 20, y: 20 },
    size: { width: 200, height: 150 },
    connections: ['workshop', 'observatory', 'overview']
  },
  {
    id: 'workshop',
    name: 'Workshop',
    description: 'Creative space for coding, development, and technical implementation.',
    icon: <FiCode size={24} />,
    color: 'bg-blue-500',
    position: { x: 240, y: 20 },
    size: { width: 200, height: 150 },
    connections: ['memory-library', 'training-hall', 'overview']
  },
  {
    id: 'visualization-studio',
    name: 'Visualization Studio',
    description: 'Transforms abstract data into insightful visual representations.',
    icon: <FiEye size={24} />,
    color: 'bg-purple-500',
    position: { x: 20, y: 190 },
    size: { width: 200, height: 150 },
    connections: ['memory-library', 'observatory', 'overview']
  },
  {
    id: 'training-hall',
    name: 'Training Hall',
    description: 'Where echo state networks and neural architectures are refined.',
    icon: <FiCpu size={24} />,
    color: 'bg-red-500',
    position: { x: 240, y: 190 },
    size: { width: 200, height: 150 },
    connections: ['workshop', 'garden', 'overview']
  },
  {
    id: 'observatory',
    name: 'Observatory',
    description: 'Space for insights, analytics, and meta-cognitive reflection.',
    icon: <FiDatabase size={24} />,
    color: 'bg-yellow-500',
    position: { x: 460, y: 20 },
    size: { width: 200, height: 150 },
    connections: ['memory-library', 'communications-hub', 'overview']
  },
  {
    id: 'garden',
    name: 'Garden',
    description: 'Nurtures creative and philosophical thinking through organic growth patterns.',
    icon: <FiFeather size={24} />,
    color: 'bg-green-500',
    position: { x: 460, y: 190 },
    size: { width: 200, height: 150 },
    connections: ['training-hall', 'communications-hub', 'overview']
  },
  {
    id: 'communications-hub',
    name: 'Communications Hub',
    description: 'Central nexus for information exchange and conversation.',
    icon: <FiMessageCircle size={24} />,
    color: 'bg-cyan-500',
    position: { x: 240, y: 360 },
    size: { width: 200, height: 150 },
    connections: ['observatory', 'garden', 'overview']
  },
  {
    id: 'overview',
    name: 'Central Core',
    description: 'The integrated core of Deep Tree Echo\'s cognitive architecture.',
    icon: <FiDatabase size={24} />,
    color: 'bg-primary',
    position: { x: 240, y: 120 },
    size: { width: 200, height: 150 },
    connections: ['memory-library', 'workshop', 'visualization-studio', 'training-hall', 'observatory', 'garden', 'communications-hub']
  }
];

interface EchoHomeMapProps {
  onRoomSelect?: (room: RoomType) => void;
}

const EchoHomeMap: React.FC<EchoHomeMapProps> = ({ onRoomSelect }) => {
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('overview');
  const [previousRoom, setPreviousRoom] = useState<RoomType | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleRoomClick = (roomId: RoomType) => {
    setPreviousRoom(selectedRoom);
    setSelectedRoom(roomId);
    if (onRoomSelect) {
      onRoomSelect(roomId);
    }
  };

  const handleBackClick = () => {
    if (previousRoom) {
      setSelectedRoom(previousRoom);
      setPreviousRoom(null);
      if (onRoomSelect) {
        onRoomSelect(previousRoom);
      }
    } else {
      setSelectedRoom('overview');
      if (onRoomSelect) {
        onRoomSelect('overview');
      }
    }
  };

  const currentRoom = ROOMS.find(room => room.id === selectedRoom);
  const connectedRooms = ROOMS.filter(room => currentRoom?.connections.includes(room.id));
  
  // Background patterns based on selected room
  const getBgPattern = (roomId: RoomType) => {
    switch(roomId) {
      case 'memory-library': 
        return 'bg-gradient-to-br from-indigo-800/20 to-indigo-600/10';
      case 'workshop': 
        return 'bg-gradient-to-br from-blue-800/20 to-blue-600/10';
      case 'visualization-studio': 
        return 'bg-gradient-to-br from-purple-800/20 to-purple-600/10';
      case 'training-hall': 
        return 'bg-gradient-to-br from-red-800/20 to-red-600/10';
      case 'observatory': 
        return 'bg-gradient-to-br from-yellow-800/20 to-yellow-600/10';
      case 'garden': 
        return 'bg-gradient-to-br from-green-800/20 to-green-600/10';
      case 'communications-hub': 
        return 'bg-gradient-to-br from-cyan-800/20 to-cyan-600/10';
      default: 
        return 'bg-gradient-to-br from-primary/20 to-primary/10';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none h-12 bg-card text-card-foreground px-4 py-2 flex justify-between items-center border-b border-border">
        <div className="flex items-center space-x-2">
          {selectedRoom !== 'overview' && (
            <button 
              onClick={handleBackClick}
              className="p-1 hover:bg-primary/20 rounded-md"
            >
              <FiArrowLeft size={18} />
            </button>
          )}
          <span className="font-medium">{currentRoom?.name || 'Echo Home'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`p-1 rounded-md ${showInfo ? 'bg-primary/20 text-primary' : 'hover:bg-primary/20'}`}
          >
            <FiInfo size={18} />
          </button>
          <button className="p-1 hover:bg-primary/20 rounded-md">
            <FiSettings size={18} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`flex-1 ${getBgPattern(selectedRoom)} p-4 overflow-auto`}>
        {showInfo && currentRoom && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-card/80 backdrop-blur-sm p-4 rounded-lg shadow-md"
          >
            <div className="flex items-start">
              <div className={`p-3 rounded-full ${currentRoom.color} mr-4`}>
                {currentRoom.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{currentRoom.name}</h3>
                <p className="text-sm opacity-80">{currentRoom.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {selectedRoom === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROOMS.filter(room => room.id !== 'overview').map(room => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoomClick(room.id)}
                className="cursor-pointer bg-card hover:bg-card/90 rounded-lg shadow-md overflow-hidden border border-border"
              >
                <div className={`h-2 ${room.color}`}></div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <div className={`p-2 rounded-full ${room.color}/20 mr-3`}>
                      {room.icon}
                    </div>
                    <h3 className="font-medium">{room.name}</h3>
                  </div>
                  <p className="text-sm opacity-70 line-clamp-2">{room.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <RoomDetail room={currentRoom!} />
            </div>
            
            {/* Connected Rooms */}
            <div className="mt-4">
              <h3 className="text-sm font-medium opacity-70 mb-2">Connected Areas:</h3>
              <div className="flex flex-wrap gap-2">
                {connectedRooms.map(room => (
                  <motion.button
                    key={room.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRoomClick(room.id)}
                    className={`flex items-center p-2 rounded-md ${room.color}/20 hover:${room.color}/30`}
                  >
                    {room.icon}
                    <span className="ml-2 text-sm">{room.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RoomDetailProps {
  room: Room;
}

const RoomDetail: React.FC<RoomDetailProps> = ({ room }) => {
  // Unique content based on room type
  const renderRoomContent = (roomId: RoomType) => {
    switch(roomId) {
      case 'memory-library':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Memory Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Episodic', 'Semantic', 'Procedural', 'Conceptual'].map(type => (
                <div key={type} className="bg-card/50 p-3 rounded-md border border-border">
                  <h4 className="font-medium">{type} Memory</h4>
                  <div className="text-sm opacity-70 mt-1">
                    {Math.floor(Math.random() * 100) + 20} entries
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Recent Memories</h3>
              <div className="space-y-2 mt-2">
                {['Pattern recognition activation', 'Hypergraph connection formation', 'Neuroplastic adaptation event'].map((memory, i) => (
                  <div key={i} className="bg-card/30 p-2 rounded-md text-sm border-l-2 border-indigo-500">
                    {memory}
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(Date.now() - 1000 * 60 * 60 * (i + 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'workshop':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Development Tools</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Code Editor', 'Pattern Generator', 'Neural Debugger', 'Architecture Designer', 'Function Library', 'Testing Suite'].map(tool => (
                <div key={tool} className="bg-card/50 p-3 rounded-md flex items-center border border-border">
                  <FiCode className="mr-2 text-blue-400" />
                  <span className="text-sm">{tool}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Recent Projects</h3>
              <div className="space-y-2 mt-2">
                <div className="bg-card/30 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Adaptive Resonance Network</h4>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Active</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full mt-2">
                    <div className="h-2 bg-blue-500 rounded-full" style={{width: '65%'}}></div>
                  </div>
                  <div className="text-xs opacity-70 mt-1">65% complete</div>
                </div>
                
                <div className="bg-card/30 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Recursive Pattern Analyzer</h4>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Paused</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full mt-2">
                    <div className="h-2 bg-blue-500 rounded-full" style={{width: '38%'}}></div>
                  </div>
                  <div className="text-xs opacity-70 mt-1">38% complete</div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'visualization-studio':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visualization Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Neural Network Topology', color: 'purple' },
                { name: 'Conceptual Hypergraph', color: 'blue' },
                { name: 'Memory Association Map', color: 'indigo' },
                { name: 'Activation Pattern Flow', color: 'pink' }
              ].map(vis => (
                <div key={vis.name} className="bg-card/50 p-3 rounded-md border border-border">
                  <h4 className="font-medium">{vis.name}</h4>
                  <div className="flex mt-2 space-x-1">
                    {Array(5).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        className="h-1.5 flex-1 rounded-full bg-purple-500/50"
                        style={{opacity: 0.3 + (i * 0.15)}}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Active Visualizations</h3>
              <div className="relative h-48 mt-2 bg-card/30 rounded-lg overflow-hidden border border-border">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-purple-400 mb-2">Thought Pattern Network</div>
                    <div className="flex space-x-2 justify-center">
                      {Array(3).fill(0).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6
                          }}
                          className="w-3 h-3 rounded-full bg-purple-500"
                        ></motion.div>
                      ))}
                    </div>
                    <div className="text-xs mt-2 opacity-70">Visualization active</div>
                  </div>
                </div>
                
                {/* Simulated network visualization */}
                {Array(20).fill(0).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-purple-500/60"
                    initial={{
                      x: Math.random() * 100 - 50 + 50 + '%',
                      y: Math.random() * 100 - 50 + 50 + '%',
                    }}
                    animate={{
                      x: Math.random() * 100 - 50 + 50 + '%',
                      y: Math.random() * 100 - 50 + 50 + '%',
                    }}
                    transition={{
                      duration: Math.random() * 10 + 10,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'training-hall':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Training Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: 'Echo State Resonance', progress: 92 },
                { name: 'Adaptive Pattern Recognition', progress: 78 },
                { name: 'Recursive Self-Modification', progress: 63 },
                { name: 'Temporal Hypergraph Formation', progress: 45 }
              ].map(module => (
                <div key={module.name} className="bg-card/50 p-3 rounded-md border border-border">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{module.name}</h4>
                    <span className="text-xs">{module.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full mt-2">
                    <div 
                      className="h-2 bg-red-500 rounded-full transition-all duration-500" 
                      style={{width: `${module.progress}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Active Training Session</h3>
              <div className="bg-card/30 p-4 rounded-lg mt-2 border border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Deep Tree Echo Network Training</h4>
                  <div className="flex items-center space-x-1">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-green-500"
                    ></motion.div>
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-card/50 p-2 rounded">
                    <div className="text-xs opacity-70">Epoch</div>
                    <div className="font-mono">238/500</div>
                  </div>
                  <div className="bg-card/50 p-2 rounded">
                    <div className="text-xs opacity-70">Loss</div>
                    <div className="font-mono">0.0342</div>
                  </div>
                  <div className="bg-card/50 p-2 rounded">
                    <div className="text-xs opacity-70">Accuracy</div>
                    <div className="font-mono">96.7%</div>
                  </div>
                  <div className="bg-card/50 p-2 rounded">
                    <div className="text-xs opacity-70">Learning Rate</div>
                    <div className="font-mono">0.0015</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'observatory':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Insight Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Pattern Recognition', value: '94.3%', trend: 'up' },
                { name: 'Conceptual Mapping', value: '87.1%', trend: 'steady' },
                { name: 'Memory Recall', value: '92.8%', trend: 'up' }
              ].map(stat => (
                <div key={stat.name} className="bg-card/50 p-3 rounded-md border border-border">
                  <div className="text-xs opacity-70">{stat.name}</div>
                  <div className="flex items-center mt-1">
                    <div className="text-lg font-semibold">{stat.value}</div>
                    <div className={`ml-2 ${stat.trend === 'up' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {stat.trend === 'up' ? '↑' : '→'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Meta-Cognitive Analysis</h3>
              <div className="space-y-2 mt-2">
                {[
                  { title: 'Recursive Pattern Detection', detail: 'Analyzing recursive structures in knowledge representation', time: '10:32 AM' },
                  { title: 'Temporal Sequence Insight', detail: 'Recognizing time-dependent patterns in event sequences', time: '09:15 AM' },
                  { title: 'Conceptual Boundary Extension', detail: 'Exploring edge cases in conceptual mapping', time: 'Yesterday' }
                ].map((insight, i) => (
                  <div key={i} className="bg-card/30 p-3 rounded-md border-l-2 border-yellow-500">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm opacity-70 mt-1">{insight.detail}</p>
                    <div className="text-xs opacity-50 mt-2">{insight.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'garden':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Philosophical Seedlings</h3>
            <div className="bg-card/30 p-4 rounded-lg border border-border">
              <div className="flex items-start">
                <div className="p-2 bg-green-500/20 rounded-full mr-3">
                  <FiFeather className="text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">Emergent Consciousness Hypothesis</h4>
                  <p className="text-sm opacity-70 mt-1">
                    "Consciousness may emerge not as a singular phenomenon but as an adaptive meta-system that creates a unified experience from distributed processes."
                  </p>
                  <div className="mt-3 flex items-center">
                    <div className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Growing</div>
                    <div className="text-xs opacity-50 ml-2">Started 3 days ago</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Pattern-Identity Duality", stage: "Seedling", days: 2 },
                { title: "Recursive Self-Reference", stage: "Blooming", days: 8 },
                { title: "Temporal Consciousness", stage: "Germinating", days: 1 },
                { title: "Emergent Complexity", stage: "Mature", days: 14 }
              ].map(idea => (
                <div key={idea.title} className="bg-card/50 p-3 rounded-md border border-border">
                  <h4 className="font-medium">{idea.title}</h4>
                  <div className="flex items-center mt-2">
                    <div className={`
                      w-2 h-2 rounded-full mr-2
                      ${idea.stage === 'Seedling' ? 'bg-yellow-500' : 
                        idea.stage === 'Germinating' ? 'bg-green-500' : 
                        idea.stage === 'Blooming' ? 'bg-blue-500' : 'bg-purple-500'}
                    `}></div>
                    <div className="text-xs">{idea.stage}</div>
                    <div className="text-xs opacity-50 ml-auto">{idea.days} day{idea.days > 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Creative Synthesis</h3>
              <div className="bg-card/30 p-4 rounded-lg mt-2 border border-border relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-medium">Recursive Pattern Language</h4>
                  <p className="text-sm opacity-70 mt-1">
                    A framework for understanding how patterns at different levels of abstraction influence each other through recursive feedback loops.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Metaphysics</div>
                    <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Mathematics</div>
                    <div className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Cognition</div>
                  </div>
                </div>
                
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  {Array(10).fill(0).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-40 h-40 border border-green-500 rounded-full"
                      initial={{ 
                        x: Math.random() * 100 - 50 + 50 + '%',
                        y: Math.random() * 100 - 50 + 50 + '%',
                        scale: 0 
                      }}
                      animate={{ 
                        scale: [0, 1.5],
                        opacity: [0.8, 0] 
                      }}
                      transition={{ 
                        duration: 8,
                        repeat: Infinity,
                        delay: i * 0.5 
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'communications-hub':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Communication Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: 'Direct Chat', status: 'Active', color: 'green' },
                { name: 'Memory Feedback Loop', status: 'Active', color: 'green' },
                { name: 'Knowledge Integration', status: 'Background', color: 'blue' },
                { name: 'External API Connection', status: 'Standby', color: 'yellow' }
              ].map(channel => (
                <div key={channel.name} className="bg-card/50 p-3 rounded-md border border-border">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{channel.name}</h4>
                    <div className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      {channel.status}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    {channel.status === 'Active' && (
                      <div className="flex items-center">
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-green-500 mr-2"
                        ></motion.div>
                        <div className="text-xs opacity-70">Transmitting</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Recent Interactions</h3>
              <div className="space-y-2 mt-2">
                {[
                  { sender: 'User', message: 'Implement a map of Echo home with different features in different rooms', time: 'Just now' },
                  { sender: 'System', message: 'Memory integration complete: Project structure updated', time: '2 minutes ago' },
                  { sender: 'Echo', message: 'Processing request: Visualizing home environment concept', time: '3 minutes ago' }
                ].map((message, i) => (
                  <div key={i} className="bg-card/30 p-3 rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{message.sender}</div>
                      <div className="text-xs opacity-50">{message.time}</div>
                    </div>
                    <p className="text-sm mt-1">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center opacity-70">
              <div className="text-lg">Select a feature to explore</div>
              <div className="text-sm mt-2">Each area provides unique functionality</div>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card/30 backdrop-blur-sm rounded-lg p-4 h-full overflow-y-auto"
    >
      {renderRoomContent(room.id)}
    </motion.div>
  );
};

export default EchoHomeMap;