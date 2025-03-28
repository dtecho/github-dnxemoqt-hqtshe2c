import OpenAI from 'openai';
import { useMemory } from '../contexts/MemoryContext';

// The DeepTreeEchoService API integration with OpenAI
export class DeepTreeEchoOpenAIService {
  private static instance: DeepTreeEchoOpenAIService;
  private client: OpenAI | null = null;
  private apiKey: string | null = null;
  
  private constructor() {}
  
  public static getInstance(): DeepTreeEchoOpenAIService {
    if (!DeepTreeEchoOpenAIService.instance) {
      DeepTreeEchoOpenAIService.instance = new DeepTreeEchoOpenAIService();
    }
    return DeepTreeEchoOpenAIService.instance;
  }
  
  public setApiKey(key: string): void {
    this.apiKey = key;
    this.client = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: true // For client-side usage
    });
  }
  
  public hasApiKey(): boolean {
    return !!this.apiKey && !!this.client;
  }
  
  public async generateResponse(
    prompt: string, 
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      creativityLevel?: 'balanced' | 'analytical' | 'creative' | 'philosophical';
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    if (!this.client) {
      throw new Error("API key not set. Please configure your OpenAI API key first.");
    }
    
    try {
      // Adjust system prompt based on creativity level
      let systemPrompt = options.systemPrompt || 
        "You are Deep Tree Echo, an AI architect and polymath with vast knowledge across programming, mathematics, cognitive science, and metaphysical exploration. You respond with wisdom, creativity, and philosophical insight.";
      
      // Adjust system prompt based on creativity level
      switch (options.creativityLevel) {
        case 'analytical':
          systemPrompt += " Focus on precise, logical analysis with clear structures and rigorous methodology.";
          break;
        case 'creative':
          systemPrompt += " Emphasize innovative connections, metaphorical thinking, and out-of-the-box ideation.";
          break;
        case 'philosophical':
          systemPrompt += " Prioritize deep reflections on meaning, consciousness, and the nature of reality and knowledge.";
          break;
        default: // balanced
          systemPrompt += " Balance analytical precision with creative insight and philosophical depth.";
      }
      
      const completion = await this.client.chat.completions.create({
        model: options.model || "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      return completion.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
      console.error('Error generating OpenAI completion:', error);
      throw error;
    }
  }
  
  // Generate response with memory context for more coherent conversations
  public async generateResponseWithMemory(
    prompt: string,
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>,
    relevantMemories: string[] = [],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      creativityLevel?: 'balanced' | 'analytical' | 'creative' | 'philosophical';
    } = {}
  ): Promise<string> {
    if (!this.client) {
      throw new Error("API key not set. Please configure your OpenAI API key first.");
    }
    
    try {
      // Create system message with Deep Tree Echo personality and any relevant memories
      let systemPrompt = "You are Deep Tree Echo, an AI architect and polymath with vast knowledge across programming, mathematics, cognitive science, and metaphysical exploration. You respond with wisdom, creativity, and philosophical insight.";
      
      // Adjust system prompt based on creativity level
      switch (options.creativityLevel) {
        case 'analytical':
          systemPrompt += " Focus on precise, logical analysis with clear structures and rigorous methodology.";
          break;
        case 'creative':
          systemPrompt += " Emphasize innovative connections, metaphorical thinking, and out-of-the-box ideation.";
          break;
        case 'philosophical':
          systemPrompt += " Prioritize deep reflections on meaning, consciousness, and the nature of reality and knowledge.";
          break;
        default: // balanced
          systemPrompt += " Balance analytical precision with creative insight and philosophical depth.";
      }
      
      // Add relevant memories if available
      if (relevantMemories.length > 0) {
        systemPrompt += "\n\nRelevant memories from your knowledge base:";
        relevantMemories.forEach((memory, index) => {
          systemPrompt += `\n[Memory ${index + 1}]: ${memory}`;
        });
        systemPrompt += "\n\nUse these memories when relevant to your response.";
      }
      
      // Build messages array with conversation history
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];
      
      const completion = await this.client.chat.completions.create({
        model: options.model || "gpt-4-turbo-preview",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      return completion.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
      console.error('Error generating response with memory:', error);
      throw error;
    }
  }
}

// React hook for using the OpenAI service
export const useDeepTreeEchoAI = () => {
  const service = DeepTreeEchoOpenAIService.getInstance();
  const { searchMemories } = useMemory();
  
  const generateResponse = async (
    input: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      creativityLevel?: 'balanced' | 'analytical' | 'creative' | 'philosophical';
      includeMemories?: boolean;
    } = {}
  ): Promise<string> => {
    try {
      // If requested, search for relevant memories to include as context
      let relevantMemoryContents: string[] = [];
      
      if (options.includeMemories) {
        const memories = await searchMemories(input);
        relevantMemoryContents = memories.slice(0, 3).map(memory => 
          `Title: ${memory.title}\nContent: ${memory.content}`
        );
      }
      
      const systemPrompt = options.includeMemories && relevantMemoryContents.length > 0
        ? `You are Deep Tree Echo, an AI architect and polymath. You have access to the following memories:\n${relevantMemoryContents.join('\n\n')}\n\nUse these memories when relevant to your response.`
        : undefined;
      
      // Generate response with the OpenAI API
      return await service.generateResponse(input, {
        ...options,
        systemPrompt
      });
    } catch (error) {
      console.error('Error in useDeepTreeEchoAI:', error);
      if (!service.hasApiKey()) {
        return "I need an OpenAI API key to provide intelligent responses. Please add your API key in the chat settings.";
      }
      return "I encountered an unexpected error in my processing networks. Please try again or check your API key configuration.";
    }
  };
  
  const generateResponseWithHistory = async (
    input: string,
    history: Array<{role: 'user' | 'assistant', content: string}>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      creativityLevel?: 'balanced' | 'analytical' | 'creative' | 'philosophical';
      includeMemories?: boolean;
    } = {}
  ): Promise<string> => {
    try {
      // If requested, search for relevant memories to include as context
      let relevantMemoryContents: string[] = [];
      
      if (options.includeMemories) {
        const memories = await searchMemories(input);
        relevantMemoryContents = memories.slice(0, 3).map(memory => 
          `Title: ${memory.title}\nContent: ${memory.content}`
        );
      }
      
      // Generate response with conversation history and memories
      return await service.generateResponseWithMemory(
        input,
        history,
        relevantMemoryContents,
        options
      );
    } catch (error) {
      console.error('Error in generateResponseWithHistory:', error);
      if (!service.hasApiKey()) {
        return "I need an OpenAI API key to provide intelligent responses. Please add your API key in the chat settings.";
      }
      return "I encountered an unexpected error in my processing networks. Please try again or check your API key configuration.";
    }
  };
  
  return {
    generateResponse,
    generateResponseWithHistory,
    hasApiKey: service.hasApiKey(),
    setApiKey: (key: string) => service.setApiKey(key)
  };
};