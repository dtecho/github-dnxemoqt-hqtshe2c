import { RoomType } from '../components/EchoHomeMap';
import { useOrchestrator } from '../contexts/OrchestratorContext';
import { FileData } from '../store/appStore';
import { supabase } from './supabaseClient';
import { useMem0AI } from '../services/mem0aiService';
import { useDeepTreeEchoAI } from '../services/openaiService';

/**
 * Service class to orchestrate interactions between different components
 * of the Deep Tree Echo system.
 */
export class OrchestratorService {
  private static instance: OrchestratorService;
  private userId: string | null = null;
  private isAuthenticated: boolean = false;
  private activeConnections: Map<string, any> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    // Initialize service
    this.initializeAuth();
  }

  public static getInstance(): OrchestratorService {
    if (!OrchestratorService.instance) {
      OrchestratorService.instance = new OrchestratorService();
    }
    return OrchestratorService.instance;
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        this.isAuthenticated = true;
        this.userId = data.session.user.id;
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.isAuthenticated = true;
          this.userId = session.user.id;
          this.dispatchEvent('auth_change', { status: 'signed_in', userId: session.user.id });
        } else if (event === 'SIGNED_OUT') {
          this.isAuthenticated = false;
          this.userId = null;
          this.dispatchEvent('auth_change', { status: 'signed_out' });
        }
      });
    } catch (error) {
      console.error('Error initializing auth in orchestrator:', error);
    }
  }

  /**
   * Register an event listener
   */
  public addEventListener(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Dispatch an event to all registered listeners
   */
  private dispatchEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Navigate to a specific component and perform necessary setup
   */
  public navigateTo(component: string, options?: any): void {
    this.dispatchEvent('navigation', { target: component, options });
  }

  /**
   * Navigate to a specific room in the map view
   */
  public navigateToRoom(room: RoomType): void {
    this.dispatchEvent('room_change', { room });
  }

  /**
   * Focus on a specific file in the editor
   */
  public focusFile(file: FileData): void {
    this.dispatchEvent('file_focus', { file });
  }

  /**
   * Register a component connection
   */
  public registerComponent(componentId: string, componentInterface: any): void {
    this.activeConnections.set(componentId, componentInterface);
    this.dispatchEvent('component_registered', { componentId });
  }

  /**
   * Unregister a component connection
   */
  public unregisterComponent(componentId: string): void {
    this.activeConnections.delete(componentId);
    this.dispatchEvent('component_unregistered', { componentId });
  }

  /**
   * Check if a component is registered
   */
  public isComponentRegistered(componentId: string): boolean {
    return this.activeConnections.has(componentId);
  }

  /**
   * Get a reference to a registered component interface
   */
  public getComponentInterface(componentId: string): any {
    return this.activeConnections.get(componentId);
  }

  /**
   * Transfer content between components
   */
  public transferContent(fromComponent: string, toComponent: string, content: any): boolean {
    const sourceInterface = this.activeConnections.get(fromComponent);
    const targetInterface = this.activeConnections.get(toComponent);
    
    if (!sourceInterface || !targetInterface) {
      console.error(`Cannot transfer content: one or both components not registered`);
      return false;
    }
    
    this.dispatchEvent('content_transfer', { 
      from: fromComponent, 
      to: toComponent, 
      contentType: typeof content 
    });
    
    return true;
  }

  /**
   * Execute command in terminal
   */
  public async executeInTerminal(command: string): Promise<string> {
    this.dispatchEvent('terminal_command', { command });
    
    // In a real implementation, this would interact with the actual terminal
    // For now, return a simulated response
    return `Simulated output for command: ${command}`;
  }

  /**
   * Get the current authentication status
   */
  public getAuthStatus(): { isAuthenticated: boolean; userId: string | null } {
    return {
      isAuthenticated: this.isAuthenticated,
      userId: this.userId
    };
  }
}

// React hook for using the orchestrator service
export const useOrchestratorService = () => {
  const orchestratorService = OrchestratorService.getInstance();
  const orchestrator = useOrchestrator();
  const mem0ai = useMem0AI();
  const deepTreeEchoAI = useDeepTreeEchoAI();
  
  return {
    // Navigation
    navigateTo: (component: string, options?: any) => {
      orchestratorService.navigateTo(component, options);
      // Also update the context state
      orchestrator.setActiveComponent(component as any);
    },
    navigateToRoom: (room: RoomType) => {
      orchestratorService.navigateToRoom(room);
      orchestrator.navigateToRoom(room);
    },
    focusFile: (file: FileData) => {
      orchestratorService.focusFile(file);
      orchestrator.focusOnFile(file.id);
    },
    
    // Component registration
    registerComponent: (componentId: string, componentInterface: any) => 
      orchestratorService.registerComponent(componentId, componentInterface),
    unregisterComponent: (componentId: string) => 
      orchestratorService.unregisterComponent(componentId),
    getComponentInterface: (componentId: string) => 
      orchestratorService.getComponentInterface(componentId),
    
    // Content transfer
    transferContent: (fromComponent: string, toComponent: string, content: any) => {
      orchestratorService.transferContent(fromComponent, toComponent, content);
      return orchestrator.transferContentBetweenComponents(fromComponent, toComponent, content);
    },
    
    // Terminal integration
    executeCommand: (command: string) => orchestrator.executeInTerminal(command),
    
    // Memory operations
    saveToMemory: (content: any, tags: string[]) => orchestrator.saveToMemory(content, tags),
    
    // AI interactions
    generateAIResponse: async (prompt: string, options?: any) => {
      orchestrator.logEvent({
        type: 'ai_interaction',
        description: 'AI response requested',
        component: orchestrator.state.activeComponent,
        data: { promptLength: prompt.length }
      });
      
      if (mem0ai.isInitialized()) {
        return mem0ai.generateResponseWithMemoryContext(
          prompt,
          [], // Empty history for direct response
          options
        );
      } else if (deepTreeEchoAI.hasApiKey) {
        return deepTreeEchoAI.generateResponse(prompt, options);
      } else {
        return "AI systems not initialized. Please configure API key in settings.";
      }
    },
    
    // System status
    getSystemStatus: () => ({
      health: orchestrator.state.systemHealthStatus,
      memoryIntegration: orchestrator.state.memoryIntegrationStatus,
      aiIntegration: orchestrator.state.aiIntegrationStatus,
      activeComponent: orchestrator.state.activeComponent,
      currentRoom: orchestrator.state.activeRoom
    }),
    
    // Events
    addEventListener: (event: string, callback: Function) => 
      orchestratorService.addEventListener(event, callback),
      
    // Auth status
    getAuthStatus: () => orchestratorService.getAuthStatus()
  };
};