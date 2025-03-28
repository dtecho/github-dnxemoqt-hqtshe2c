import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';

interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MemoryContextType {
  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory>;
  updateMemory: (id: string, memory: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<void>;
  getMemory: (id: string) => Promise<Memory | null>;
  searchMemories: (query: string) => Promise<Memory[]>;
  loading: boolean;
}

// Create context with a more specific default value instead of undefined
const MemoryContext = createContext<MemoryContextType>({
  memories: [],
  addMemory: async () => {
    throw new Error('MemoryProvider not initialized');
  },
  updateMemory: async () => {
    throw new Error('MemoryProvider not initialized');
    return null;
  },
  deleteMemory: async () => {
    throw new Error('MemoryProvider not initialized');
  },
  getMemory: async () => {
    throw new Error('MemoryProvider not initialized');
    return null;
  },
  searchMemories: async () => {
    throw new Error('MemoryProvider not initialized');
    return [];
  },
  loading: true
});

export const useMemory = () => {
  return useContext(MemoryContext);
};

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize memory store
  useEffect(() => {
    const initializeMemories = async () => {
      try {
        const storedMemories = await localforage.getItem<Memory[]>('memories');
        setMemories(storedMemories || []);
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMemories();
  }, []);

  // Save memories whenever they change
  useEffect(() => {
    if (!loading) {
      localforage.setItem('memories', memories);
    }
  }, [memories, loading]);

  const addMemory = async (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> => {
    const now = new Date().toISOString();
    const newMemory: Memory = {
      ...memoryData,
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    setMemories((prev) => [...prev, newMemory]);
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

    return updatedMemory;
  };

  const deleteMemory = async (id: string): Promise<void> => {
    setMemories((prev) => prev.filter((memory) => memory.id !== id));
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

  return (
    <MemoryContext.Provider
      value={{
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        getMemory,
        searchMemories,
        loading,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
};