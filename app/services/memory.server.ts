import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { HierarchicalNSW } from 'hnswlib-node';
import { getVectorStoreService } from './vectorStore.server';

export interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  embedding?: number[] | null;
  userId?: string | null;
  type?: 'episodic' | 'semantic' | 'procedural' | 'declarative' | 'implicit' | 'associative' | 'memory';
  context?: string;
  metadata?: Record<string, any>;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  similarity: number;
}

export class MemoryService {
  private supabase: ReturnType<typeof createClient>;
  private openai: OpenAI | null = null;
  private vectorStore = getVectorStoreService();
  private userId: string | null = null;

  constructor(supabaseUrl: string, supabaseKey: string, userId?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.userId = userId || null;
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public async addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'embedding'>): Promise<Memory> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    // Generate embedding if OpenAI is available
    let embedding = null;
    if (this.openai) {
      embedding = await this.vectorStore.generateEmbedding(memory.content);
    }

    // Current timestamp
    const now = new Date().toISOString();

    // Insert into Supabase
    const { data, error } = await this.supabase
      .from('memories')
      .insert({
        user_id: this.userId,
        title: memory.title,
        content: memory.content,
        tags: memory.tags || [],
        embedding,
        created_at: now,
        updated_at: now,
        metadata: memory.metadata || {},
        context: memory.context || null,
        type: memory.type || 'memory'
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      tags: data.tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      embedding: data.embedding,
      metadata: data.metadata,
      context: data.context,
      type: data.type
    };
  }

  public async searchMemories(query: string, options?: {
    threshold?: number;
    limit?: number;
    type?: string;
  }): Promise<MemorySearchResult[]> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    // If vector store is available, use semantic search
    if (this.openai) {
      return this.vectorStore.searchSimilar(this.userId, query, options);
    }

    // Fallback to basic text search
    const { data, error } = await this.supabase
      .from('memories')
      .select('id, content, metadata')
      .eq('user_id', this.userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(options?.limit || 5);

    if (error) {
      throw error;
    }

    return data.map(item => ({
      id: item.id,
      content: item.content,
      metadata: item.metadata,
      similarity: 0.8 // Placeholder similarity score
    }));
  }

  public async getMemoryStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byTag: Record<string, number>;
    recentlyAdded: number;
    recentlyAccessed: number;
  }> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    // Get total memories
    const { data: totalData, error: totalError } = await this.supabase
      .from('memories')
      .select('id', { count: 'exact' })
      .eq('user_id', this.userId);

    if (totalError) {
      throw totalError;
    }

    // Get memories by type
    const { data: typeData, error: typeError } = await this.supabase
      .from('memories')
      .select('type')
      .eq('user_id', this.userId);

    if (typeError) {
      throw typeError;
    }

    // Get memories by tag
    const { data: tagData, error: tagError } = await this.supabase
      .from('memories')
      .select('tags')
      .eq('user_id', this.userId);

    if (tagError) {
      throw tagError;
    }

    // Get recently added memories
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentData, error: recentError } = await this.supabase
      .from('memories')
      .select('id', { count: 'exact' })
      .eq('user_id', this.userId)
      .gte('created_at', oneDayAgo.toISOString());

    if (recentError) {
      throw recentError;
    }

    // Count by type
    const byType: Record<string, number> = {};
    typeData.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    // Count by tag
    const byTag: Record<string, number> = {};
    tagData.forEach(item => {
      item.tags.forEach(tag => {
        byTag[tag] = (byTag[tag] || 0) + 1;
      });
    });

    return {
      total: totalData.length,
      byType,
      byTag,
      recentlyAdded: recentData.length,
      recentlyAccessed: 0 // Would need additional tracking in the database
    };
  }
}

// Create a server-side memory service instance
let memoryService: MemoryService | null = null;

export const getMemoryService = (userId?: string) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables not set');
  }
  
  if (!memoryService) {
    memoryService = new MemoryService(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      userId
    );
  } else if (userId) {
    memoryService.setUserId(userId);
  }
  
  return memoryService;
};