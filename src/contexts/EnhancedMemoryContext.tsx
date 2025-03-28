import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';
import { supabase } from '../services/supabaseClient';

interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  embeddings?: number[] | null;
  userId?: string | null;
}

interface EnhancedMemoryContextType {
  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory>;
  updateMemory: (id: string, memory: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<void>;
  getMemory: (id: string) => Promise<Memory | null>;
  searchMemories: (query: string) => Promise<Memory[]>;
  semanticSearch: (query: string, limit?: number) => Promise<Memory[]>;
  loading: boolean;
  syncWithSupabase: () => Promise<void>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const EnhancedMemoryContext = createContext<EnhancedMemoryContextType | undefined>(undefined);

export const useEnhancedMemory = () => {
  const context = useContext(EnhancedMemoryContext);
  if (context === undefined) {
    throw new Error('useEnhancedMemory must be used within an EnhancedMemoryProvider');
  }
  return context;
};

export const EnhancedMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsAuthenticated(true);
        setUserId(data.session.user.id);
      }
    };
    
    checkSession();
  }, []);

  // Initialize memory store
  useEffect(() => {
    const initializeMemories = async () => {
      try {
        // First load from local storage
        const storedMemories = await localforage.getItem<Memory[]>('enhanced-memories');
        
        // If authenticated, attempt to load from Supabase
        if (isAuthenticated && userId) {
          const { data, error } = await supabase
            .from('memories')
            .select('*')
            .eq('user_id', userId);
            
          if (error) {
            console.error('Error fetching memories from Supabase:', error);
          } else if (data) {
            // Merge with local memories (prefer remote)
            const remoteMemoriesMap = new Map(data.map(item => [item.id, item]));
            const localOnlyMemories = (storedMemories || []).filter(
              mem => !remoteMemoriesMap.has(mem.id)
            );
            
            setMemories([...data, ...localOnlyMemories]);
            return;
          }
        }
        
        // Fallback to just local memories
        setMemories(storedMemories || []);
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMemories();
  }, [isAuthenticated, userId]);

  // Save memories to local storage whenever they change
  useEffect(() => {
    if (!loading) {
      localforage.setItem('enhanced-memories', memories);
    }
  }, [memories, loading]);

  const addMemory = async (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> => {
    const now = new Date().toISOString();
    const newMemory: Memory = {
      ...memoryData,
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      userId: userId,
    };

    setMemories((prev) => [...prev, newMemory]);
    
    // If authenticated, also save to Supabase
    if (isAuthenticated && userId) {
      try {
        await supabase.from('memories').insert({
          id: newMemory.id,
          title: newMemory.title,
          content: newMemory.content,
          tags: newMemory.tags,
          created_at: newMemory.createdAt,
          updated_at: newMemory.updatedAt,
          user_id: userId
        });
      } catch (error) {
        console.error('Error saving memory to Supabase:', error);
      }
    }
    
    return newMemory;
  };

  const updateMemory = async (
    id: string,
    memoryData: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Memory | null> => {
    let updatedMemory: Memory | null = null;

    setMemories((prev) => {
      const newMemories = prev.map((memory) => {
        if (memory.id === id) {
          updatedMemory = {
            ...memory,
            ...memoryData,
            updatedAt: new Date().toISOString(),
          };
          return updatedMemory;
        }
        return memory;
      });
      return newMemories;
    });
    
    // If authenticated, also update in Supabase
    if (isAuthenticated && userId && updatedMemory) {
      try {
        await supabase
          .from('memories')
          .update({
            title: updatedMemory.title,
            content: updatedMemory.content,
            tags: updatedMemory.tags,
            updated_at: updatedMemory.updatedAt
          })
          .eq('id', id)
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error updating memory in Supabase:', error);
      }
    }

    return updatedMemory;
  };

  const deleteMemory = async (id: string): Promise<void> => {
    setMemories((prev) => prev.filter((memory) => memory.id !== id));
    
    // If authenticated, also delete from Supabase
    if (isAuthenticated && userId) {
      try {
        await supabase
          .from('memories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error deleting memory from Supabase:', error);
      }
    }
  };

  const getMemory = async (id: string): Promise<Memory | null> => {
    return memories.find((memory) => memory.id === id) || null;
  };

  const searchMemories = async (query: string): Promise<Memory[]> => {
    const normalizedQuery = query.toLowerCase();
    return memories.filter(
      (memory) =>
        memory.title.toLowerCase().includes(normalizedQuery) ||
        memory.content.toLowerCase().includes(normalizedQuery) ||
        memory.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  };
  
  // Simulate semantic search - in a real app this would use embeddings
  const semanticSearch = async (query: string, limit: number = 5): Promise<Memory[]> => {
    // This is just a placeholder for actual semantic search
    // Would normally use vector embeddings and similarity search
    const results = await searchMemories(query);
    return results.slice(0, limit);
  };
  
  // Function to sync local memories to Supabase
  const syncWithSupabase = async (): Promise<void> => {
    if (!isAuthenticated || !userId) {
      throw new Error('User must be authenticated to sync with Supabase');
    }
    
    setLoading(true);
    
    try {
      // Get remote memories
      const { data: remoteMemories, error } = await supabase
        .from('memories')
        .select('id')
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      // Create a set of remote memory IDs for quick lookup
      const remoteMemoryIds = new Set(remoteMemories?.map(m => m.id) || []);
      
      // Filter memories that need to be inserted (not in remote)
      const memoriesToInsert = memories.filter(mem => !remoteMemoryIds.has(mem.id));
      
      // Insert in batches if needed
      if (memoriesToInsert.length > 0) {
        const formattedMemories = memoriesToInsert.map(mem => ({
          id: mem.id,
          title: mem.title,
          content: mem.content,
          tags: mem.tags,
          created_at: mem.createdAt,
          updated_at: mem.updatedAt,
          user_id: userId
        }));
        
        // Insert in batches of 100 (Supabase limitation)
        for (let i = 0; i < formattedMemories.length; i += 100) {
          const batch = formattedMemories.slice(i, i + 100);
          const { error: insertError } = await supabase.from('memories').insert(batch);
          
          if (insertError) {
            console.error('Error inserting memories batch:', insertError);
          }
        }
      }
      
      console.log(`Synced ${memoriesToInsert.length} memories to Supabase`);
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Authentication functions
  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    if (data.user) {
      setIsAuthenticated(true);
      setUserId(data.user.id);
    }
  };
  
  const signup = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    if (data.user) {
      setIsAuthenticated(true);
      setUserId(data.user.id);
    }
  };
  
  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    setIsAuthenticated(false);
    setUserId(null);
  };

  return (
    <EnhancedMemoryContext.Provider
      value={{
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        getMemory,
        searchMemories,
        semanticSearch,
        loading,
        syncWithSupabase,
        isAuthenticated,
        login,
        signup,
        logout
      }}
    >
      {children}
    </EnhancedMemoryContext.Provider>
  );
};