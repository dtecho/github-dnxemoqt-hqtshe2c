import { OpenAI } from 'openai';
import { HfInference } from '@huggingface/inference';
import { LlamaIndex } from 'llamaindex';
import { createClient } from '@supabase/supabase-js';
import { getMemoryService } from './memory.server';

export interface AIServiceConfig {
  openaiApiKey?: string;
  huggingfaceApiKey?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  userId?: string;
}

export interface AIResponse {
  text: string;
  source?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export class AIService {
  private static instance: AIService;
  private openai: OpenAI | null = null;
  private hf: HfInference | null = null;
  private llama: LlamaIndex | null = null;
  private supabase: ReturnType<typeof createClient> | null = null;
  private userId: string | null = null;
  private memoryService = getMemoryService();

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public initialize(config: AIServiceConfig): void {
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
        dangerouslyAllowBrowser: true
      });
    }

    if (config.huggingfaceApiKey) {
      this.hf = new HfInference(config.huggingfaceApiKey);
    }

    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }

    if (config.userId) {
      this.userId = config.userId;
    }

    // Initialize LlamaIndex with OpenAI if available
    if (this.openai) {
      this.llama = new LlamaIndex({
        llm: {
          type: 'openai',
          apiKey: config.openaiApiKey
        }
      });
    }
  }

  public isInitialized(): boolean {
    return !!this.openai || !!this.hf;
  }

  public async generateResponse(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      useMemoryContext?: boolean;
      provider?: 'openai' | 'huggingface' | 'llama';
    } = {}
  ): Promise<AIResponse> {
    const { model = 'gpt-4-turbo', provider = 'openai' } = options;

    // Get relevant memories if requested
    let contextMemories: string[] = [];
    if (options.useMemoryContext && this.userId) {
      const memories = await this.memoryService.searchMemories(prompt, {
        limit: 3,
        threshold: 0.7
      });
      contextMemories = memories.map(mem => mem.content);
    }

    // Build context-aware prompt
    const contextPrompt = contextMemories.length > 0
      ? `Context from memory:\n${contextMemories.join('\n\n')}\n\nUser request: ${prompt}`
      : prompt;

    try {
      switch (provider) {
        case 'openai':
          if (!this.openai) throw new Error('OpenAI not initialized');
          const completion = await this.openai.chat.completions.create({
            model,
            messages: [{ role: 'user', content: contextPrompt }],
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens,
          });
          return {
            text: completion.choices[0]?.message?.content || '',
            source: 'openai',
            metadata: { model }
          };

        case 'huggingface':
          if (!this.hf) throw new Error('HuggingFace not initialized');
          const response = await this.hf.textGeneration({
            model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
            inputs: contextPrompt,
            parameters: {
              temperature: options.temperature ?? 0.7,
              max_new_tokens: options.maxTokens ?? 1000
            }
          });
          return {
            text: response.generated_text,
            source: 'huggingface',
            metadata: { model: 'Mixtral-8x7B' }
          };

        case 'llama':
          if (!this.llama) throw new Error('LlamaIndex not initialized');
          const llamaResponse = await this.llama.query(contextPrompt);
          return {
            text: llamaResponse.toString(),
            source: 'llama',
            metadata: { model: 'llama-index' }
          };

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
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
      throw error;
    }
  }

  public async analyzeMemories(): Promise<{
    insights: string[];
    patterns: string[];
    recommendations: string[];
  }> {
    if (!this.openai || !this.userId) {
      throw new Error('OpenAI or user not initialized');
    }

    try {
      const memories = await this.memoryService.listMemories({ limit: 20 });
      const memoryText = memories.map(m => 
        `Title: ${m.title}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}`
      ).join('\n\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze the provided memories and extract insights, patterns, and recommendations. Format your response as JSON with three arrays: insights, patterns, and recommendations.'
          },
          {
            role: 'user',
            content: memoryText
          }
        ],
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        insights: analysis.insights || [],
        patterns: analysis.patterns || [],
        recommendations: analysis.recommendations || []
      };
    } catch (error) {
      console.error('Error analyzing memories:', error);
      throw error;
    }
  }
}

// React hook for using AIService
export const useAI = () => {
  const service = AIService.getInstance();
  
  return {
    initialize: (config: AIServiceConfig) => service.initialize(config),
    isInitialized: () => service.isInitialized(),
    generateResponse: (prompt: string, options?: Parameters<typeof service.generateResponse>[1]) => 
      service.generateResponse(prompt, options),
    generateEmbedding: (text: string) => service.generateEmbedding(text),
    analyzeMemories: () => service.analyzeMemories()
  };
};