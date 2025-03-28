# Current Deep Tree Echo Architecture

```mermaid
graph TD
    %% Main Components
    Browser["Browser Environment"]
    WebContainer["WebContainer (Node.js Runtime)"]
    App["App Component"]
    
    %% Core Systems
    Memory["Memory System"]
    Orchestrator["Orchestrator"]
    
    %% UI Components
    Terminal["Terminal Component"]
    Editor["Editor Components"]
    Chat["Chat Interface"]
    MapView["Echo Home Map"]
    
    %% Services Layer
    AI["AI Services"]
    DB["Database Services"]
    
    %% External Services
    Supabase["Supabase"]
    OpenAI["OpenAI API"]
    
    %% Connections - Main Structure
    Browser --> WebContainer
    WebContainer --> App
    App --> Orchestrator
    
    %% Core Component Connections
    Orchestrator --> Memory
    Orchestrator --> Terminal
    Orchestrator --> Editor
    Orchestrator --> Chat
    Orchestrator --> MapView
    
    %% Service Connections
    Memory --> DB
    Chat --> AI
    Terminal --> AI
    
    %% External API Connections
    DB --> Supabase
    AI --> OpenAI
    
    %% Inter-component Communications
    Terminal -.-> |executeCommand| Orchestrator
    Chat -.-> |executeInTerminal| Orchestrator
    Editor -.-> |saveToMemory| Memory
    
    %% Context Providers
    subgraph "Context Providers"
        MemoryProvider["Memory Provider"]
        OrchestratorProvider["Orchestrator Provider"]
    end
    
    App --> MemoryProvider
    MemoryProvider --> OrchestratorProvider
    OrchestratorProvider --> Memory
    OrchestratorProvider --> Orchestrator
    
    %% Services
    subgraph "Services"
        openaiService["OpenAI Service"]
        mem0aiService["Mem0AI Service"]
        supabaseClient["Supabase Client"]
        llmService["LLM Service"]
    end
    
    AI --> openaiService
    AI --> mem0aiService
    AI --> llmService
    DB --> supabaseClient
    
    %% Styles
    classDef core fill:#f9f,stroke:#333,stroke-width:2px
    classDef ui fill:#bbf,stroke:#333,stroke-width:1px
    classDef service fill:#fbb,stroke:#333,stroke-width:1px
    classDef external fill:#bfb,stroke:#333,stroke-width:1px
    classDef container fill:#fffbe6,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    
    class App,Orchestrator,Memory core
    class Terminal,Editor,Chat,MapView ui
    class AI,DB service
    class Supabase,OpenAI external
    class WebContainer,Browser container
```

## Key Components Description

- **WebContainer**: In-browser Node.js runtime environment that hosts the application
- **Orchestrator**: Central coordination system that manages communication between components
- **Memory System**: Stores and retrieves data using both local and cloud-based storage
- **Terminal**: Interactive command-line interface with AI assistance capabilities
- **Editor**: Code editing environment with Monaco and CodeMirror
- **Chat**: Conversational interface to interact with Deep Tree Echo
- **Echo Home Map**: Spatial interface with different specialized rooms
- **Services**: Various services for AI, memory, and database operations