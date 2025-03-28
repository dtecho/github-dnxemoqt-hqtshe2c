import { supabase } from './supabaseClient';
import { RoomType } from '../components/EchoHomeMap';

export interface OrchestrationEvent {
  event_type: string;
  description: string;
  component: string;
  user_id?: string;
  data?: any;
}

export interface SystemHealthStatus {
  operational_status: 'optimal' | 'degraded' | 'impaired';
  memory_usage: number;
  active_connections: number;
  details?: any;
}

export class OrchestratorDatabaseService {
  private static instance: OrchestratorDatabaseService;
  private userId: string | null = null;
  private isAuthenticated: boolean = false;

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): OrchestratorDatabaseService {
    if (!OrchestratorDatabaseService.instance) {
      OrchestratorDatabaseService.instance = new OrchestratorDatabaseService();
    }
    return OrchestratorDatabaseService.instance;
  }

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
        } else if (event === 'SIGNED_OUT') {
          this.isAuthenticated = false;
          this.userId = null;
        }
      });
    } catch (error) {
      console.error('Error initializing auth in orchestrator database service:', error);
    }
  }

  public async logEvent(event: OrchestrationEvent): Promise<void> {
    if (!this.isAuthenticated) {
      console.log('Not authenticated, storing event locally only');
      return;
    }

    try {
      const { error } = await supabase
        .from('orchestration_events')
        .insert({
          event_type: event.event_type,
          description: event.description,
          component: event.component,
          user_id: this.userId,
          data: event.data || {}
        });

      if (error) {
        console.error('Error logging event to database:', error);
      }
    } catch (error) {
      console.error('Exception logging event to database:', error);
    }
  }

  public async recordSystemHealth(status: SystemHealthStatus): Promise<void> {
    if (!this.isAuthenticated) {
      console.log('Not authenticated, storing system health locally only');
      return;
    }

    try {
      const { error } = await supabase
        .from('system_health')
        .insert({
          operational_status: status.operational_status,
          memory_usage: status.memory_usage,
          active_connections: status.active_connections,
          details: status.details || {},
          created_by: 'orchestrator'
        });

      if (error) {
        console.error('Error recording system health to database:', error);
      }
    } catch (error) {
      console.error('Exception recording system health to database:', error);
    }
  }

  public async getRecentEvents(limit: number = 20): Promise<any[]> {
    if (!this.isAuthenticated) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('orchestration_events')
        .select('*')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception getting recent events:', error);
      return [];
    }
  }

  public async getLatestSystemHealth(): Promise<SystemHealthStatus | null> {
    if (!this.isAuthenticated) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('system_health')
        .select('*')
        .order('last_check', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error getting latest system health:', error);
        return null;
      }

      return {
        operational_status: data.operational_status,
        memory_usage: data.memory_usage,
        active_connections: data.active_connections,
        details: data.details
      };
    } catch (error) {
      console.error('Exception getting latest system health:', error);
      return null;
    }
  }

  public async clearUserEvents(): Promise<void> {
    if (!this.isAuthenticated || !this.userId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orchestration_events')
        .delete()
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error clearing user events:', error);
      }
    } catch (error) {
      console.error('Exception clearing user events:', error);
    }
  }

  public getAuthStatus(): { isAuthenticated: boolean; userId: string | null } {
    return {
      isAuthenticated: this.isAuthenticated,
      userId: this.userId
    };
  }
}

// Create a hook for using the orchestrator database service
export const useOrchestratorDatabaseService = () => {
  const service = OrchestratorDatabaseService.getInstance();
  
  return {
    logEvent: (event: OrchestrationEvent) => service.logEvent(event),
    recordSystemHealth: (status: SystemHealthStatus) => service.recordSystemHealth(status),
    getRecentEvents: (limit?: number) => service.getRecentEvents(limit),
    getLatestSystemHealth: () => service.getLatestSystemHealth(),
    clearUserEvents: () => service.clearUserEvents(),
    getAuthStatus: () => service.getAuthStatus()
  };
};