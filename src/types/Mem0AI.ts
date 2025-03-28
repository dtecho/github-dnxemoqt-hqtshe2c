export interface Mem0ry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  context?: string;
  type?: Mem0ryType;
  embedding?: number[];
}

export type Mem0ryType = 
  | 'episodic'     // Personal experiences and events
  | 'semantic'     // Facts, concepts, and general knowledge
  | 'procedural'   // Skills and how to perform tasks
  | 'declarative'  // Explicit knowledge that can be verbalized
  | 'implicit'     // Unconscious, automatic knowledge
  | 'associative'  // Connected ideas and concepts
  | 'memory';      // Default type

export interface Mem0rySearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  similarity: number;
}

export interface Mem0ryQueryOptions {
  threshold?: number;
  limit?: number;
  type?: Mem0ryType;
  includeTags?: string[];
  excludeTags?: string[];
  timeframe?: {
    start?: Date;
    end?: Date;
  };
}

export interface Mem0ryStats {
  total: number;
  byType: Record<Mem0ryType, number>;
  byTag: Record<string, number>;
  recentlyAdded: number;
  recentlyAccessed: number;
}

export interface Mem0AISummary {
  insights: string[];
  frequentConcepts: string[];
  knowledgeGaps: string[];
  recommendations: string[];
}