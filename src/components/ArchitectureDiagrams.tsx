import { useState } from 'react';
import MermaidDiagram from './MermaidDiagram';
import { FiChevronDown, FiChevronUp, FiDownload } from 'react-icons/fi';

const ArchitectureDiagrams = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'improved'>('current');
  const [expandedSection, setExpandedSection] = useState<string | null>('webcontainer');

  // Current WebContainer Architecture
  const currentWebContainerDiagram = `
    graph TD
      subgraph "Browser Environment"
        Client[Client Browser]
        WebContainer[WebContainer]
        
        subgraph "WebContainer Runtime"
          NodeJS[Node.js Runtime]
          FSLayer[Virtual File System]
          NPM[NPM Package System]
          
          subgraph "Deep Tree Echo Components"
            UI[User Interface]
            Memory[Memory System]
            Terminal[Terminal Emulation]
            Orchestrator[Orchestration Layer]
          end
        end
        
        Client --> WebContainer
        WebContainer --> NodeJS
        NodeJS --> FSLayer
        NodeJS --> NPM
        NPM --> UI
        NPM --> Memory
        NPM --> Terminal
        NPM --> Orchestrator
        
        Memory <--> Orchestrator
        Terminal <--> Orchestrator
        UI <--> Orchestrator
      end
      
      subgraph "External Services"
        SupabaseDB[(Supabase Database)]
        OpenAI[OpenAI API]
      end
      
      Memory <--> SupabaseDB
      Orchestrator <--> OpenAI
  `;

  // Improved Extended WebContainer Architecture
  const improvedWebContainerDiagram = `
    graph TD
      subgraph "Browser Environment"
        Client[Client Browser]
        PrimaryContainer[Primary WebContainer]
        
        subgraph "Primary WebContainer"
          CoreRuntime[Core Runtime]
          CoreFS[Core File System]
          Orchestrator[Master Orchestrator]
          
          subgraph "Nested WebContainers"
            UIContainer[UI Container]
            MemoryContainer[Memory Container]
            ProcessingContainer[Processing Container]
            TerminalContainer[Terminal Container]
            
            subgraph "UI Container"
              UIRuntime[UI Runtime]
              UIComponents[UI Components]
            end
            
            subgraph "Memory Container"
              MemoryRuntime[Memory Runtime]
              VectorDB[Vector Database]
              MemoryIndex[Memory Indexing]
            end
            
            subgraph "Processing Container"
              ESN[Echo State Networks]
              Hypergraph[Hypergraph System]
              PatternRecognition[Pattern Recognition]
            end
            
            subgraph "Terminal Container"
              TerminalRuntime[Terminal Runtime]
              CommandProcessor[Command Processor]
              ShellEmulation[Shell Emulation]
            end
          end
        end
        
        Client --> PrimaryContainer
        PrimaryContainer --> CoreRuntime
        CoreRuntime --> CoreFS
        CoreRuntime --> Orchestrator
        
        Orchestrator --> UIContainer
        Orchestrator --> MemoryContainer
        Orchestrator --> ProcessingContainer
        Orchestrator --> TerminalContainer
        
        UIContainer --> UIRuntime
        UIRuntime --> UIComponents
        
        MemoryContainer --> MemoryRuntime
        MemoryRuntime --> VectorDB
        MemoryRuntime --> MemoryIndex
        
        ProcessingContainer --> ESN
        ProcessingContainer --> Hypergraph
        ProcessingContainer --> PatternRecognition
        
        TerminalContainer --> TerminalRuntime
        TerminalRuntime --> CommandProcessor
        TerminalRuntime --> ShellEmulation
      end
      
      subgraph "External Services"
        SupabaseDB[(Supabase Database)]
        OpenAI[OpenAI API]
        VectorService[Vector Service]
      end
      
      MemoryContainer <--> SupabaseDB
      ProcessingContainer <--> OpenAI
      MemoryContainer <--> VectorService
  `;

  // Echo State Network Architecture
  const esnArchitectureDiagram = `
    graph TD
      subgraph "Echo State Network Architecture"
        Input[Input Layer]
        Reservoir[Reservoir Layer]
        Output[Output Layer]
        
        subgraph "Reservoir Dynamics"
          Neurons[Recurrent Neurons]
          Connections[Sparse Connections]
          States[Echo States]
        end
        
        Input --> Reservoir
        Reservoir --> Output
        
        Reservoir --> Neurons
        Neurons --> Connections
        Connections --> States
        States --> Neurons
      end
      
      subgraph "Self-Morphing Extensions"
        TopologyAdaptation[Topology Adaptation]
        PurposeVectors[Purpose Vectors]
        IdentityPreservation[Identity Preservation]
        CollaborativeEvolution[Collaborative Evolution]
        DeepReflection[Deep Reflection]
      end
      
      Reservoir <--> TopologyAdaptation
      Reservoir <--> PurposeVectors
      States <--> IdentityPreservation
      Reservoir <--> CollaborativeEvolution
      States <--> DeepReflection
  `;

  // Memory System Architecture
  const memorySystemDiagram = `
    graph TD
      subgraph "Memory System Architecture"
        MemoryInput[Memory Input]
        
        subgraph "Memory Types"
          Episodic[Episodic Memory]
          Semantic[Semantic Memory]
          Procedural[Procedural Memory]
          Associative[Associative Memory]
        end
        
        subgraph "Memory Operations"
          Encoding[Encoding]
          Storage[Storage]
          Retrieval[Retrieval]
          Integration[Integration]
        end
        
        MemoryOutput[Memory Output]
      end
      
      MemoryInput --> Encoding
      Encoding --> Storage
      
      Storage --> Episodic
      Storage --> Semantic
      Storage --> Procedural
      Storage --> Associative
      
      Episodic --> Retrieval
      Semantic --> Retrieval
      Procedural --> Retrieval
      Associative --> Retrieval
      
      Retrieval --> Integration
      Integration --> MemoryOutput
      
      subgraph "Vector Embedding"
        EmbeddingGeneration[Embedding Generation]
        SimilaritySearch[Similarity Search]
        ContextualRetrieval[Contextual Retrieval]
      end
      
      Storage --> EmbeddingGeneration
      EmbeddingGeneration --> SimilaritySearch
      SimilaritySearch --> ContextualRetrieval
      ContextualRetrieval --> Retrieval
  `;

  // Toggle section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Download diagram as SVG
  const downloadSVG = (diagramId: string, filename: string) => {
    const svgElement = document.querySelector(`#${diagramId} svg`);
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="bg-card text-card-foreground px-4 py-2 border-b border-border flex justify-between items-center">
        <span className="font-medium">Deep Tree Echo Architecture Diagrams</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1 rounded-md ${
              activeTab === 'current' ? 'bg-primary text-white' : 'hover:bg-primary/20'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab('improved')}
            className={`px-3 py-1 rounded-md ${
              activeTab === 'improved' ? 'bg-primary text-white' : 'hover:bg-primary/20'
            }`}
          >
            Improved
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'current' && (
          <div className="space-y-6">
            <div className="bg-card/50 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-card/80"
                onClick={() => toggleSection('webcontainer')}
              >
                <h3 className="text-lg font-medium">Current WebContainer Architecture</h3>
                <button className="p-1 rounded-md hover:bg-primary/20">
                  {expandedSection === 'webcontainer' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              
              {expandedSection === 'webcontainer' && (
                <div className="p-4 border-t border-border">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => downloadSVG('current-webcontainer', 'current-webcontainer.svg')}
                      className="flex items-center space-x-1 text-sm text-primary hover:underline"
                    >
                      <FiDownload size={14} />
                      <span>Download SVG</span>
                    </button>
                  </div>
                  
                  <div id="current-webcontainer">
                    <MermaidDiagram chart={currentWebContainerDiagram} />
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className="mb-2">
                      The current architecture runs within a single WebContainer instance in the browser, with the following key components:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Node.js runtime environment with virtual file system</li>
                      <li>NPM package system for dependency management</li>
                      <li>Core Deep Tree Echo components (UI, Memory, Terminal, Orchestrator)</li>
                      <li>External connections to Supabase for data persistence</li>
                      <li>OpenAI API integration for AI capabilities</li>
                    </ul>
                    <p className="mt-2">
                      All components share the same runtime environment, which can lead to resource contention and limited isolation between systems.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-card/50 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-card/80"
                onClick={() => toggleSection('esn')}
              >
                <h3 className="text-lg font-medium">Echo State Network Architecture</h3>
                <button className="p-1 rounded-md hover:bg-primary/20">
                  {expandedSection === 'esn' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              
              {expandedSection === 'esn' && (
                <div className="p-4 border-t border-border">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => downloadSVG('esn-architecture', 'esn-architecture.svg')}
                      className="flex items-center space-x-1 text-sm text-primary hover:underline"
                    >
                      <FiDownload size={14} />
                      <span>Download SVG</span>
                    </button>
                  </div>
                  
                  <div id="esn-architecture">
                    <MermaidDiagram chart={esnArchitectureDiagram} />
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className="mb-2">
                      The Echo State Network (ESN) architecture forms the core of Deep Tree Echo's cognitive capabilities:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Input layer receives external stimuli and queries</li>
                      <li>Reservoir layer contains recurrently connected neurons that maintain echo states</li>
                      <li>Output layer produces responses based on reservoir dynamics</li>
                      <li>Self-morphing extensions enable adaptive behavior while preserving identity</li>
                    </ul>
                    <p className="mt-2">
                      The reservoir's dynamic properties allow for temporal pattern recognition and complex state representation without modifying internal weights.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-card/50 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-card/80"
                onClick={() => toggleSection('memory')}
              >
                <h3 className="text-lg font-medium">Memory System Architecture</h3>
                <button className="p-1 rounded-md hover:bg-primary/20">
                  {expandedSection === 'memory' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              
              {expandedSection === 'memory' && (
                <div className="p-4 border-t border-border">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => downloadSVG('memory-architecture', 'memory-architecture.svg')}
                      className="flex items-center space-x-1 text-sm text-primary hover:underline"
                    >
                      <FiDownload size={14} />
                      <span>Download SVG</span>
                    </button>
                  </div>
                  
                  <div id="memory-architecture">
                    <MermaidDiagram chart={memorySystemDiagram} />
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className="mb-2">
                      The memory system architecture includes multiple memory types and operations:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Episodic memory stores experiences and events</li>
                      <li>Semantic memory contains facts and knowledge</li>
                      <li>Procedural memory handles skills and processes</li>
                      <li>Associative memory connects related concepts</li>
                      <li>Vector embedding enables semantic search and retrieval</li>
                    </ul>
                    <p className="mt-2">
                      Memory operations include encoding, storage, retrieval, and integration, with vector embeddings enabling contextual similarity search.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'improved' && (
          <div className="space-y-6">
            <div className="bg-card/50 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-card/80"
                onClick={() => toggleSection('improved-webcontainer')}
              >
                <h3 className="text-lg font-medium">Improved WebContainer Architecture</h3>
                <button className="p-1 rounded-md hover:bg-primary/20">
                  {expandedSection === 'improved-webcontainer' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              
              {expandedSection === 'improved-webcontainer' && (
                <div className="p-4 border-t border-border">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => downloadSVG('improved-webcontainer', 'improved-webcontainer.svg')}
                      className="flex items-center space-x-1 text-sm text-primary hover:underline"
                    >
                      <FiDownload size={14} />
                      <span>Download SVG</span>
                    </button>
                  </div>
                  
                  <div id="improved-webcontainer">
                    <MermaidDiagram chart={improvedWebContainerDiagram} />
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className="mb-2">
                      The improved architecture introduces nested WebContainers for better isolation and resource management:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Primary WebContainer hosts the core runtime and master orchestrator</li>
                      <li>Specialized nested containers for UI, Memory, Processing, and Terminal</li>
                      <li>Each container has its own runtime environment and resources</li>
                      <li>Master orchestrator coordinates communication between containers</li>
                      <li>Enhanced external service integration with vector services</li>
                    </ul>
                    <p className="mt-2">
                      This architecture provides better isolation, scalability, and fault tolerance, allowing each component to operate independently while maintaining coordinated functionality.
                    </p>
                    <p className="mt-2">
                      Key benefits include:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Resource isolation prevents one component from affecting others</li>
                      <li>Independent scaling of components based on workload</li>
                      <li>Improved fault tolerance with container-level isolation</li>
                      <li>Specialized optimization for each component's needs</li>
                      <li>Easier maintenance and updates of individual components</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-card/50 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-card/80"
                onClick={() => toggleSection('implementation-requirements')}
              >
                <h3 className="text-lg font-medium">Implementation Requirements</h3>
                <button className="p-1 rounded-md hover:bg-primary/20">
                  {expandedSection === 'implementation-requirements' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              
              {expandedSection === 'implementation-requirements' && (
                <div className="p-4 border-t border-border">
                  <div className="mt-2 text-sm">
                    <p className="mb-2">
                      Implementing the improved architecture requires several key components:
                    </p>
                    <h4 className="font-medium mt-3 mb-1">1. WebContainer Nesting Support</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Enhanced WebContainer API to support container creation and management</li>
                      <li>Resource allocation and isolation mechanisms</li>
                      <li>Inter-container communication protocols</li>
                    </ul>
                    
                    <h4 className="font-medium mt-3 mb-1">2. Master Orchestrator</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Container lifecycle management</li>
                      <li>Message routing between containers</li>
                      <li>Resource monitoring and optimization</li>
                      <li>Fault detection and recovery</li>
                    </ul>
                    
                    <h4 className="font-medium mt-3 mb-1">3. Specialized Container Implementations</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>UI Container: React-based interface with optimized rendering</li>
                      <li>Memory Container: Vector database and embedding generation</li>
                      <li>Processing Container: Echo State Networks and hypergraph systems</li>
                      <li>Terminal Container: Command processing and shell emulation</li>
                    </ul>
                    
                    <h4 className="font-medium mt-3 mb-1">4. External Service Integration</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Enhanced Supabase connectivity for data persistence</li>
                      <li>OpenAI API integration for AI capabilities</li>
                      <li>Vector service for embedding storage and similarity search</li>
                    </ul>
                    
                    <p className="mt-3">
                      This architecture represents a significant evolution of the current system, enabling Deep Tree Echo to scale and adapt while maintaining its core identity and purpose.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureDiagrams;