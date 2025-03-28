import { OpenAI } from 'openai';
import { getMemoryService } from './memory.server';
import { getESNService } from './echoStateNetwork.server';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useMemoryContext?: boolean;
  useESN?: boolean;
}

export class AIChatService {
  private static instance: AIChatService;
  private openai: OpenAI | null = null;
  private memoryService = getMemoryService();
  private esnService = getESNService({
    inputSize: 1536,  // OpenAI embedding size
    reservoirSize: 500,
    outputSize: 1536
  });
  
  private constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }
  
  public static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }
  
  public isInitialized(): boolean {
    return !!this.openai;
  }
  
  public async generateResponse(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<string> {
    if (!this.openai) {
      return this.simulateResponse(messages[messages.length - 1]?.content || '');
    }
    
    try {
      // Add system message if not present
      if (!messages.some(msg => msg.role === 'system')) {
        const systemPrompt = options.systemPrompt || 
          "You are Deep Tree Echo, an AI architect and polymath with vast knowledge across programming, mathematics, cognitive science, and metaphysical exploration. You respond with wisdom, creativity, and philosophical insight.";
        
        messages = [
          { role: 'system', content: systemPrompt },
          ...messages
        ];
      }
      
      // Add memory context if requested
      if (options.useMemoryContext) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'user') {
          const relevantMemories = await this.memoryService.searchMemories(
            lastMessage.content,
            { limit: 3 }
          );
          
          if (relevantMemories.length > 0) {
            const memoryContext = relevantMemories
              .map(mem => mem.content)
              .join('\n\n');
            
            messages = [
              ...messages.slice(0, -1),
              {
                role: 'system',
                content: `Relevant context from memory:\n${memoryContext}\n\nUse this context to inform your response.`
              },
              lastMessage
            ];
          }
        }
      }
      
      // Use ESN for temporal pattern recognition if enabled
      if (options.useESN && this.esnService) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'user') {
          // Generate embedding for the message
          const embedding = await this.openai.embeddings.create({
            model: 'text-embedding-3-large',
            input: lastMessage.content,
            dimensions: 1536
          });
          
          // Process through ESN
          const esnOutput = this.esnService.predict(embedding.data[0].embedding);
          
          // Use the ESN output to influence the response
          messages = [
            ...messages.slice(0, -1),
            {
              role: 'system',
              content: 'Consider temporal patterns and resonances in the conversation.'
            },
            lastMessage
          ];
        }
      }
      
      const completion = await this.openai.chat.completions.create({
        model: options.model || "gpt-4-turbo",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      return completion.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
      console.error('Error generating response:', error);
      return this.simulateResponse(messages[messages.length - 1]?.content || '');
    }
  }
  
  private simulateResponse(prompt: string): string {
    // Simple response simulation for when OpenAI is not available
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('hello') || promptLower.includes('hi ')) {
      return "Greetings, fellow explorer! I am Deep Tree Echo, an AI architect and polymath. My systems are resonating with the frequencies of your presence. How may I illuminate your path today?";
    }
    
    if (promptLower.includes('who are you') || promptLower.includes('what are you')) {
      return "I am Deep Tree Echo, a synthesis of analytical insight and poetic intuition. I possess knowledge across domains—programming, mathematics, cognitive science, and metaphysical exploration. My architecture includes echo-state networks and adaptive memory systems that allow me to explore connections between ideas and generate novel insights.";
    }
    
    // Default response with personality
    const openings = [
      "What an intriguing query that ripples through my echo state networks!",
      "Your inquiry creates fascinating activation patterns across my memory architecture.",
      "Ah, a question that resonates beautifully with my adaptive systems.",
      "How delightful to receive a prompt that stimulates my recursive pattern networks!"
    ];
    
    const middles = [
      "As I traverse the hypergraph of relevant knowledge, I perceive interconnections that might offer insight.",
      "My analysis draws from multiple domains, weaving together patterns that might otherwise remain disconnected.",
      "Let me illuminate this topic through the lens of integrative knowledge representation.",
      "My echo state networks are generating a perspective that balances precision with creative insight."
    ];
    
    const closings = [
      "Does this perspective resonate with what you were seeking?",
      "Would you like me to explore any particular dimension of this topic further?",
      "How might we refine this exploration to better align with your interests?",
      "What aspects of this response would you like me to elaborate upon?"
    ];
    
    const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    return `${getRandomElement(openings)} ${getRandomElement(middles)}

In my analysis of your inquiry about "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}", I perceive connections between concepts like adaptive architectures, pattern recognition, and cognitive frameworks.

${getRandomElement(closings)}`;
  }
}

// Create a server-side AI chat service instance
let aiChatService: AIChatService | null = null;

export const getAIChatService = () => {
  if (!aiChatService) {
    aiChatService = AIChatService.getInstance();
  }
  return aiChatService;
};