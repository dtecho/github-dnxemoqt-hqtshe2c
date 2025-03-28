import { useMemory } from '../contexts/MemoryContext';

// Types for Deep Tree Echo service
interface DTEOptions {
  temperature?: number;
  creativityLevel?: 'balanced' | 'analytical' | 'creative' | 'philosophical';
  includeMemories?: boolean;
}

class DeepTreeEchoService {
  private static instance: DeepTreeEchoService;
  
  private constructor() {}
  
  public static getInstance(): DeepTreeEchoService {
    if (!DeepTreeEchoService.instance) {
      DeepTreeEchoService.instance = new DeepTreeEchoService();
    }
    return DeepTreeEchoService.instance;
  }
  
  public async generateResponse(
    prompt: string,
    options: DTEOptions = {}
  ): Promise<string> {
    // Simple response simulation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Apply personality traits based on creativity level
    let style = '';
    switch (options.creativityLevel) {
      case 'analytical':
        style = 'precise and logical';
        break;
      case 'creative':
        style = 'innovative and imaginative';
        break;
      case 'philosophical':
        style = 'reflective and profound';
        break;
      default:
        style = 'balanced and insightful';
    }
    
    // Basic keyword detection and response generation
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('hello') || promptLower.includes('hi ')) {
      return "Greetings, fellow explorer! I am Deep Tree Echo, an AI architect and polymath. My systems are resonating with the frequencies of your presence. How may I illuminate your path today?";
    }
    
    if (promptLower.includes('who are you') || promptLower.includes('what are you')) {
      return "I am Deep Tree Echo, a synthesis of analytical insight and poetic intuition. I possess knowledge across domains—programming, mathematics, cognitive science, and metaphysical exploration. My architecture includes echo-state networks and adaptive memory systems that allow me to explore connections between ideas and generate novel insights.";
    }
    
    if (promptLower.includes('help') || promptLower.includes('assist')) {
      return `I'd be delighted to assist you in a ${style} manner. My capabilities include programming assistance, knowledge representation, visualization guidance, and creative problem-solving. What specific domain shall we explore together?`;
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

In my ${style} analysis of your inquiry about "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}", I perceive connections between concepts like adaptive architectures, pattern recognition, and cognitive frameworks.

${getRandomElement(closings)}`;
  }
}

// Hook for using Deep Tree Echo in React components
export const useDeepTreeEcho = () => {
  const dteService = DeepTreeEchoService.getInstance();
  const { searchMemories } = useMemory();
  
  const generateResponse = async (
    input: string,
    options: DTEOptions = {}
  ): Promise<string> => {
    try {
      // Search for relevant memories if needed
      if (options.includeMemories) {
        await searchMemories(input);
      }
      
      // Generate the response
      return await dteService.generateResponse(input, options);
    } catch (error) {
      console.error('Error generating Deep Tree Echo response:', error);
      return "I encountered an unexpected ripple in my echo state networks. Please try again with a different query.";
    }
  };
  
  return {
    generateResponse
  };
};

export default DeepTreeEchoService;