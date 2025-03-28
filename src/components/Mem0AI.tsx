import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiEdit2, FiTag, FiInfo, FiChevronDown, FiX, FiSettings, FiRotateCcw, FiDatabase } from 'react-icons/fi';
import { useMem0AI } from '../services/mem0aiService';
import { supabase } from '../services/supabaseClient';
import { Mem0ry, Mem0ryType, Mem0rySearchResult, Mem0AISummary } from '../types/Mem0AI';

const memoryTypes: { id: Mem0ryType; name: string; description: string }[] = [
  { id: 'episodic', name: 'Episodic', description: 'Personal experiences and events' },
  { id: 'semantic', name: 'Semantic', description: 'Facts, concepts, and general knowledge' },
  { id: 'procedural', name: 'Procedural', description: 'Skills and how to perform tasks' },
  { id: 'declarative', name: 'Declarative', description: 'Explicit knowledge that can be verbalized' },
  { id: 'implicit', name: 'Implicit', description: 'Unconscious, automatic knowledge' },
  { id: 'associative', name: 'Associative', description: 'Connected ideas and concepts' },
  { id: 'memory', name: 'General Memory', description: 'Default memory type' }
];

const Mem0AI = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Mem0ry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Mem0rySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Mem0ry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState<Mem0AISummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedType, setSelectedType] = useState<Mem0ryType | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  
  // New memory form state
  const [newMemory, setNewMemory] = useState<{
    title: string;
    content: string;
    tags: string[];
    type: Mem0ryType;
    context?: string;
  }>({
    title: '',
    content: '',
    tags: [],
    type: 'memory',
  });
  
  const [tagInput, setTagInput] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const mem0ai = useMem0AI();
  
  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsAuthenticated(true);
          setUserId(data.session.user.id);
          
          // Try to initialize Mem0AI with stored API key
          const storedApiKey = localStorage.getItem('openai_api_key');
          if (storedApiKey) {
            setApiKey(storedApiKey);
            mem0ai.initialize(storedApiKey, data.session.user.id);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    checkSession();
  }, []);
  
  // Load memories when authenticated and initialized
  useEffect(() => {
    const loadMemories = async () => {
      if (isAuthenticated && userId && mem0ai.isInitialized()) {
        try {
          const fetchedMemories = await mem0ai.listMemories({ limit: 20 });
          setMemories(fetchedMemories);
          
          // Extract all unique tags
          const tags = new Set<string>();
          fetchedMemories.forEach(memory => {
            memory.tags?.forEach(tag => tags.add(tag));
          });
          setAllTags(Array.from(tags));
          
          // Get memory stats
          const memoryStats = await mem0ai.getMemoryStats();
          setStats(memoryStats);
          
          setStatusMessage('Memories loaded successfully');
          setTimeout(() => setStatusMessage(''), 3000);
        } catch (error) {
          console.error('Error loading memories:', error);
          setStatusMessage('Error loading memories');
          setTimeout(() => setStatusMessage(''), 5000);
        }
      }
    };
    
    loadMemories();
  }, [isAuthenticated, userId, mem0ai.isInitialized()]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim() || !mem0ai.isInitialized()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const results = await mem0ai.searchMemories(searchQuery, {
        threshold: 0.7,
        limit: 5,
        type: selectedType || undefined
      });
      
      setSearchResults(results);
      setStatusMessage(`Found ${results.length} relevant memories`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error searching memories:', error);
      setStatusMessage('Error searching memories');
      setTimeout(() => setStatusMessage(''), 5000);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectMemory = async (memoryId: string) => {
    if (!mem0ai.isInitialized()) return;
    
    try {
      const memory = await mem0ai.getMemory(memoryId);
      setSelectedMemory(memory);
      setNewMemory({
        title: memory?.title || '',
        content: memory?.content || '',
        tags: memory?.tags || [],
        type: memory?.type || 'memory',
        context: memory?.context || ''
      });
    } catch (error) {
      console.error('Error selecting memory:', error);
    }
  };
  
  const handleSaveApiKey = () => {
    if (apiKey.trim() && userId) {
      localStorage.setItem('openai_api_key', apiKey);
      mem0ai.initialize(apiKey, userId);
      setShowSettings(false);
      setStatusMessage('API key saved and initialized');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };
  
  const handleCreateMemory = async () => {
    if (!mem0ai.isInitialized()) {
      setStatusMessage('Please set your OpenAI API key first');
      setShowSettings(true);
      return;
    }
    
    if (!newMemory.title.trim() || !newMemory.content.trim()) {
      setStatusMessage('Title and content are required');
      return;
    }
    
    try {
      await mem0ai.addMemory({
        title: newMemory.title,
        content: newMemory.content,
        tags: newMemory.tags,
        type: newMemory.type,
        context: newMemory.context
      });
      
      // Reset form and refresh memories
      setNewMemory({
        title: '',
        content: '',
        tags: [],
        type: 'memory'
      });
      setIsCreating(false);
      
      const fetchedMemories = await mem0ai.listMemories({ limit: 20 });
      setMemories(fetchedMemories);
      
      setStatusMessage('Memory created successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error creating memory:', error);
      setStatusMessage('Error creating memory');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };
  
  const handleUpdateMemory = async () => {
    if (!selectedMemory || !mem0ai.isInitialized()) return;
    
    try {
      await mem0ai.updateMemory(selectedMemory.id, {
        title: newMemory.title,
        content: newMemory.content,
        tags: newMemory.tags,
        type: newMemory.type,
        context: newMemory.context
      });
      
      // Refresh selected memory and memories list
      const updated = await mem0ai.getMemory(selectedMemory.id);
      setSelectedMemory(updated);
      
      const fetchedMemories = await mem0ai.listMemories({ limit: 20 });
      setMemories(fetchedMemories);
      
      setIsEditing(false);
      setStatusMessage('Memory updated successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error updating memory:', error);
      setStatusMessage('Error updating memory');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };
  
  const handleDeleteMemory = async () => {
    if (!selectedMemory || !mem0ai.isInitialized()) return;
    
    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }
    
    try {
      await mem0ai.deleteMemory(selectedMemory.id);
      
      // Reset selected memory and refresh memories list
      setSelectedMemory(null);
      
      const fetchedMemories = await mem0ai.listMemories({ limit: 20 });
      setMemories(fetchedMemories);
      
      setStatusMessage('Memory deleted successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting memory:', error);
      setStatusMessage('Error deleting memory');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };
  
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    if (!newMemory.tags.includes(tagInput.trim())) {
      setNewMemory({
        ...newMemory,
        tags: [...newMemory.tags, tagInput.trim()]
      });
      
      // Add to all tags if it's new
      if (!allTags.includes(tagInput.trim())) {
        setAllTags([...allTags, tagInput.trim()]);
      }
    }
    
    setTagInput('');
  };
  
  const handleRemoveTag = (tag: string) => {
    setNewMemory({
      ...newMemory,
      tags: newMemory.tags.filter(t => t !== tag)
    });
  };
  
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleGenerateSummary = async () => {
    if (!mem0ai.isInitialized()) {
      setStatusMessage('Please set your OpenAI API key first');
      setShowSettings(true);
      return;
    }
    
    setIsGeneratingSummary(true);
    
    try {
      const result = await mem0ai.generateMemorySummary();
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);
      setStatusMessage('Error generating memory summary');
      setTimeout(() => setStatusMessage(''), 5000);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  const handleFilterMemories = async () => {
    if (!mem0ai.isInitialized()) return;
    
    try {
      const fetchedMemories = await mem0ai.listMemories({
        type: selectedType || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        limit: 20
      });
      
      setMemories(fetchedMemories);
      setStatusMessage(`Filtered to ${fetchedMemories.length} memories`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error filtering memories:', error);
      setStatusMessage('Error filtering memories');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };
  
  const handleClearFilters = async () => {
    setSelectedType(null);
    setSelectedTags([]);
    
    if (mem0ai.isInitialized()) {
      try {
        const fetchedMemories = await mem0ai.listMemories({ limit: 20 });
        setMemories(fetchedMemories);
      } catch (error) {
        console.error('Error loading memories:', error);
      }
    }
  };
  
  const handleResizeTextarea = () => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  };
  
  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="bg-card text-card-foreground px-4 py-2 flex justify-between items-center border-b border-border">
        <div className="flex items-center">
          <FiDatabase className="mr-2 text-primary" />
          <span className="font-medium">Mem0AI Memory System</span>
        </div>
        <div className="flex space-x-2">
          {mem0ai.isInitialized() && (
            <>
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-1 rounded-md hover:bg-primary/20 ${showStats ? 'text-primary' : ''}`}
                title="Memory Stats"
              >
                <FiInfo size={18} />
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 rounded-md hover:bg-primary/20"
                title="Create Memory"
              >
                <FiPlus size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-md hover:bg-primary/20 ${showSettings ? 'text-primary' : ''}`}
            title="Settings"
          >
            <FiSettings size={18} />
          </button>
        </div>
      </div>
      
      {/* Status message */}
      {statusMessage && (
        <div className="px-4 py-2 bg-primary/20 text-sm">
          {statusMessage}
        </div>
      )}
      
      {/* Settings panel */}
      {showSettings && (
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-medium mb-2">Mem0AI Settings</h3>
          
          {!isAuthenticated ? (
            <div className="bg-card/50 p-3 rounded-md">
              <p className="text-sm mb-2">
                You need to be signed in to use Mem0AI.
              </p>
              {/* Authentication would go here */}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
                <div className="flex">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="flex-1 bg-input border border-border rounded-l-md px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="bg-primary text-white px-4 py-2 rounded-r-md text-sm"
                    disabled={!apiKey.trim() || !userId}
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs mt-1 opacity-70">
                  Your API key is required for embedding generation and memory search.
                </p>
              </div>
              
              {mem0ai.isInitialized() && (
                <div className="bg-primary/10 text-primary px-3 py-2 rounded-md text-sm">
                  Mem0AI is initialized and ready to use
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 rounded-md border border-border text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Memory Stats */}
      {showStats && stats && (
        <div className="p-4 border-b border-border">
          <div className="flex justify-between mb-3">
            <h3 className="text-lg font-medium">Memory Analytics</h3>
            <button
              onClick={() => setShowStats(false)}
              className="text-sm hover:text-primary"
            >
              <FiX size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-card/50 p-3 rounded-md">
              <span className="text-sm opacity-70">Total Memories</span>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
            <div className="bg-card/50 p-3 rounded-md">
              <span className="text-sm opacity-70">Recent Additions</span>
              <div className="text-2xl font-semibold">{stats.recentlyAdded}</div>
            </div>
            <div className="bg-card/50 p-3 rounded-md">
              <span className="text-sm opacity-70">Memory Types</span>
              <div className="text-2xl font-semibold">{Object.keys(stats.byType).filter(k => stats.byType[k] > 0).length}</div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-2">Memory Types</h4>
              <div className="space-y-2">
                {Object.entries(stats.byType)
                  .filter(([_, count]) => (count as number) > 0)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{type}</span>
                      <span className="text-sm font-medium">{count as number}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-2">Top Tags</h4>
              <div className="space-y-2">
                {Object.entries(stats.byTag)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 5)
                  .map(([tag, count]) => (
                    <div key={tag} className="flex justify-between items-center">
                      <span className="text-sm">{tag}</span>
                      <span className="text-sm font-medium">{count as number}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="bg-primary/90 hover:bg-primary text-white px-3 py-1.5 rounded-md text-sm flex items-center"
            >
              {isGeneratingSummary ? (
                <>
                  <span className="mr-2 animate-spin">↻</span>
                  Generating...
                </>
              ) : (
                <>
                  <FiRotateCcw className="mr-2" />
                  Generate Insights
                </>
              )}
            </button>
            
            {summary && (
              <div className="mt-4 bg-card/50 p-3 rounded-md">
                <h4 className="font-medium mb-2">Memory Insights</h4>
                
                <div className="space-y-3">
                  {summary.insights.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-primary">Key Insights</h5>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {summary.insights.map((insight, i) => (
                          <li key={i} className="text-sm">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {summary.frequentConcepts.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-primary">Frequent Concepts</h5>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {summary.frequentConcepts.map((concept, i) => (
                          <span key={i} className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {summary.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-primary">Recommendations</h5>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {summary.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left panel - Memory list & search */}
        <div className="w-1/3 border-r border-border flex flex-col">
          {/* Search bar */}
          <div className="p-2 border-b border-border">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="flex-1 bg-input border border-border rounded-l-md px-3 py-1.5 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-primary text-white px-3 py-1.5 rounded-r-md"
              >
                {isSearching ? (
                  <span className="animate-spin">↻</span>
                ) : (
                  <FiSearch size={16} />
                )}
              </button>
            </div>
            
            {/* Filters */}
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium">Filters</span>
                {(selectedType || selectedTags.length > 0) && (
                  <button 
                    onClick={handleClearFilters} 
                    className="text-xs text-primary"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="flex space-x-2 mb-1">
                <select
                  value={selectedType || ''}
                  onChange={(e) => setSelectedType(e.target.value as Mem0ryType || null)}
                  className="text-xs bg-input border border-border rounded px-2 py-1"
                >
                  <option value="">All Types</option>
                  {memoryTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                
                <button
                  onClick={handleFilterMemories}
                  className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                >
                  Apply
                </button>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTags.map(tag => (
                    <span 
                      key={tag} 
                      className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded flex items-center"
                    >
                      {tag}
                      <button 
                        onClick={() => handleToggleTag(tag)}
                        className="ml-1 text-primary/70 hover:text-primary"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Tag cloud */}
              {allTags.length > 0 && (
                <div className="mt-1">
                  <div 
                    className="flex items-center text-xs cursor-pointer mb-1" 
                    onClick={() => document.getElementById('tagCloud')?.classList.toggle('hidden')}
                  >
                    <FiTag size={12} className="mr-1" />
                    <span>Tags</span>
                    <FiChevronDown size={12} className="ml-1" />
                  </div>
                  
                  <div id="tagCloud" className="hidden flex flex-wrap gap-1 mt-1">
                    {allTags.map(tag => (
                      <span 
                        key={tag} 
                        onClick={() => handleToggleTag(tag)}
                        className={`text-xs px-1.5 py-0.5 rounded cursor-pointer ${
                          selectedTags.includes(tag) 
                            ? 'bg-primary/30 text-primary' 
                            : 'bg-card/50 hover:bg-card/70'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Memory List */}
          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center">
                <div className="animate-pulse">Searching...</div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="p-2 bg-card/30 border-b border-border">
                  <h3 className="text-sm font-medium">Search Results</h3>
                </div>
                <div className="divide-y divide-border">
                  {searchResults.map(result => (
                    <div
                      key={result.id}
                      onClick={() => handleSelectMemory(result.id)}
                      className="p-3 hover:bg-card/30 cursor-pointer transition-colors"
                    >
                      <div className="text-sm font-medium truncate">{result.content.substring(0, 50)}</div>
                      <div className="flex items-center mt-1">
                        <div className="text-xs opacity-70">
                          Similarity: {Math.round(result.similarity * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-border">
                  <button
                    onClick={() => setSearchResults([])}
                    className="text-xs text-primary"
                  >
                    Clear Results
                  </button>
                </div>
              </div>
            ) : memories.length > 0 ? (
              <div className="divide-y divide-border">
                {memories.map(memory => (
                  <div
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className={`p-3 hover:bg-card/30 cursor-pointer transition-colors ${
                      selectedMemory?.id === memory.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="text-sm font-medium truncate">{memory.title}</div>
                    <div className="text-xs opacity-70 truncate">{memory.content.substring(0, 60)}</div>
                    
                    <div className="flex items-center mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-card/50 mr-2">
                        {memory.type}
                      </span>
                      {memory.tags.length > 0 && (
                        <div className="flex space-x-1 overflow-hidden">
                          {memory.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {tag}
                            </span>
                          ))}
                          {memory.tags.length > 2 && (
                            <span className="text-xs px-1.5 py-0.5">+{memory.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : !mem0ai.isInitialized() ? (
              <div className="p-4 text-center">
                <div className="opacity-70">
                  Please configure your OpenAI API key to use Mem0AI
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-2 text-sm text-primary underline"
                >
                  Open Settings
                </button>
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="opacity-70">No memories found</div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-sm text-primary"
                >
                  Create Your First Memory
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right panel - Memory viewer/editor */}
        <div className="flex-1 flex flex-col">
          {isCreating ? (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Create New Memory</h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-sm"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newMemory.title}
                    onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                    placeholder="Memory title"
                    className="w-full bg-input border border-border rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    ref={contentRef}
                    value={newMemory.content}
                    onChange={(e) => {
                      setNewMemory({ ...newMemory, content: e.target.value });
                      handleResizeTextarea();
                    }}
                    placeholder="Memory content"
                    className="w-full bg-input border border-border rounded-md px-3 py-2 min-h-[100px]"
                    rows={5}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Memory Type</label>
                  <select
                    value={newMemory.type}
                    onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as Mem0ryType })}
                    className="w-full bg-input border border-border rounded-md px-3 py-2"
                  >
                    {memoryTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <p className="text-xs mt-1 opacity-70">
                    {memoryTypes.find(t => t.id === newMemory.type)?.description}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag"
                      className="flex-1 bg-input border border-border rounded-l-md px-3 py-2"
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      className="bg-primary text-white px-3 py-2 rounded-r-md"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  
                  {newMemory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newMemory.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-primary/10 text-primary text-sm px-2 py-1 rounded flex items-center"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1.5 text-primary/70 hover:text-primary"
                          >
                            <FiX size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Context (Optional)</label>
                  <textarea
                    value={newMemory.context || ''}
                    onChange={(e) => setNewMemory({ ...newMemory, context: e.target.value })}
                    placeholder="Additional context (where/when this memory was created)"
                    className="w-full bg-input border border-border rounded-md px-3 py-2"
                    rows={2}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 border border-border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMemory}
                    disabled={!newMemory.title.trim() || !newMemory.content.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Save Memory
                  </button>
                </div>
              </div>
            </div>
          ) : selectedMemory ? (
            <div className="flex-1 p-4 overflow-y-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-medium">Edit Memory</h2>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-sm"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={newMemory.title}
                      onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                      className="w-full bg-input border border-border rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <textarea
                      ref={contentRef}
                      value={newMemory.content}
                      onChange={(e) => {
                        setNewMemory({ ...newMemory, content: e.target.value });
                        handleResizeTextarea();
                      }}
                      className="w-full bg-input border border-border rounded-md px-3 py-2 min-h-[100px]"
                      rows={5}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Memory Type</label>
                    <select
                      value={newMemory.type}
                      onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as Mem0ryType })}
                      className="w-full bg-input border border-border rounded-md px-3 py-2"
                    >
                      {memoryTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add tag"
                        className="flex-1 bg-input border border-border rounded-l-md px-3 py-2"
                      />
                      <button
                        onClick={handleAddTag}
                        disabled={!tagInput.trim()}
                        className="bg-primary text-white px-3 py-2 rounded-r-md"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
                    
                    {newMemory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {newMemory.tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-primary/10 text-primary text-sm px-2 py-1 rounded flex items-center"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1.5 text-primary/70 hover:text-primary"
                            >
                              <FiX size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Context (Optional)</label>
                    <textarea
                      value={newMemory.context || ''}
                      onChange={(e) => setNewMemory({ ...newMemory, context: e.target.value })}
                      className="w-full bg-input border border-border rounded-md px-3 py-2"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateMemory}
                      className="px-4 py-2 bg-primary text-white rounded-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium">{selectedMemory.title}</h2>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-md hover:bg-primary/20"
                        title="Edit Memory"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={handleDeleteMemory}
                        className="p-1.5 rounded-md hover:bg-destructive/20 text-destructive"
                        title="Delete Memory"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {selectedMemory.type}
                    </span>
                    <span className="text-sm opacity-70">
                      Created: {new Date(selectedMemory.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {selectedMemory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {selectedMemory.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-card/50 text-sm px-2 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="bg-card/30 p-4 rounded-md whitespace-pre-wrap mb-4">
                    {selectedMemory.content}
                  </div>
                  
                  {selectedMemory.context && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Context</h3>
                      <div className="bg-card/20 p-3 rounded-md text-sm opacity-80">
                        {selectedMemory.context}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 max-w-md">
                <div className="text-6xl mb-4 opacity-20">🧠</div>
                <h2 className="text-xl font-medium mb-2">Mem0AI Memory System</h2>
                <p className="opacity-70 mb-4">
                  Your intelligent memory storage and retrieval system. Mem0AI uses advanced embeddings to create semantic connections between your memories.
                </p>
                <div className="flex justify-center space-x-4">
                  {mem0ai.isInitialized() ? (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="px-4 py-2 bg-primary text-white rounded-md"
                    >
                      Create Memory
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-4 py-2 bg-primary text-white rounded-md"
                    >
                      Configure Mem0AI
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mem0AI;