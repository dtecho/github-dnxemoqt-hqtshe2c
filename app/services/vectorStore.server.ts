import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { HierarchicalNSW } from 'hnswlib-node';

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  similarity: number;
}

export class VectorStoreService {
  private static instance: VectorStoreService;
  private supabase: ReturnType<typeof createClient>;
  private openai: OpenAI | null = null;
  private localIndex: HierarchicalNSW | null = null;
  
  private constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Initialize local vector index
    this.initializeLocalIndex();
  }
  
  private async initializeLocalIndex() {
    try {
      this.localIndex = new HierarchicalNSW('cosine', 1536);
      this.localIndex.initIndex(10000); // Max points
    } catch (error) {
      console.error('Error initializing local vector index:', error);
    }
  }
  
  public static getInstance(): VectorStoreService {
    if (!VectorStoreService.instance) {
      VectorStoreService.instance = new VectorStoreService();
    }
    return VectorStoreService.instance;
  }
  
  public async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai) {
      console.warn('OpenAI client not initialized');
      return null;
    }
    
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: text,
        dimensions: 1536
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }
  
  public async addToVectorStore(
    userId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const embedding = await this.generateEmbedding(content);
    if (!embedding) return false;
    
    try {
      // Add to Supabase
      const { error } = await this.supabase
        .from('memories')
        .update({ embedding })
        .eq('user_id', userId)
        .eq('content', content);
      
      if (error) {
        throw error;
      }
      
      // Add to local index if available
      if (this.localIndex) {
        this.localIndex.addPoint(embedding, this.localIndex.getMaxElements());
      }
      
      return true;
    } catch (error) {
      console.error('Error adding to vector store:', error);
      return false;
    }
  }
  
  public async searchSimilar(
    userId: string,
    query: string,
    options: {
      threshold?: number;
      limit?: number;
      type?: string;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const embedding = await this.generateEmbedding(query);
    if (!embedding) return [];
    
    const threshold = options.threshold || 0.7;
    const limit = options.limit || 5;
    
    try {
      // Search in Supabase
      const { data, error } = await this.supabase.rpc(
        'match_memories',
        {
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: limit,
          user_id: userId,
          filter_type: options.type
        }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error searching vector store:', error);
      
      // Fall back to local index if available
      if (this.localIndex) {
        try {
          const results = this.localIndex.searchKnn(embedding, limit);
          return results.neighbors.map((id, i) => ({
            id: id.toString(),
            content: 'Local result',
            similarity: 1 - results.distances[i]
          }));
        } catch (localError) {
          console.error('Error searching local index:', localError);
        }
      }
      
      return [];
    }
  }
}

// Create a server-side vector store service instance
let vectorStoreService: VectorStoreService | null = null;

export const getVectorStoreService = () => {
  if (!vectorStoreService) {
    vectorStoreService = VectorStoreService.getInstance();
  }
  return vectorStoreService;
};