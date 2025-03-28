import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { useAIChat } from '../services/aiChatService';
import { supabase } from '../services/supabaseClient';
import { setTerminalExecutionFunction } from '../contexts/OrchestratorContext';
import 'xterm/css/xterm.css';

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isTerminalReady, setIsTerminalReady] = useState<boolean>(false);
  const [terminalMounted, setTerminalMounted] = useState(false);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/home/project');
  
  // For aichat functionality
  const [currentChat, setCurrentChat] = useState<string>('default');
  const [streamingResponse, setStreamingResponse] = useState<boolean>(false);
  const aiChat = useAIChat();
  
  // Command autocomplete
  const [tabCompletions, setTabCompletions] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState<number>(-1);
  const availableCommands = [
    'help', 'clear', 'echo', 'memory', 'cd', 'ls', 'pwd', 
    'aichat', 'ai', 'prompt', 'prompts', 'mkdir', 'touch'
  ];

  // This effect runs once to set terminalMounted to true after the component is mounted
  useEffect(() => {
    setTerminalMounted(true);
    
    // Try to initialize AI Chat with stored API key
    const initializeAIChat = async () => {
      const storedApiKey = localStorage.getItem('openai_api_key');
      if (storedApiKey) {
        try {
          const { data } = await supabase.auth.getSession();
          aiChat.initialize(storedApiKey, data.session?.user?.id);
          aiChat.createChat(currentChat);
        } catch (error) {
          console.error('Error initializing AI Chat:', error);
        }
      }
    };
    
    initializeAIChat();
    
    // Register the terminal execution function with the orchestrator
    setTerminalExecutionFunction(executeTerminalCommand);
    
    return () => {
      // Clean up terminal on unmount
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, []);

  // This effect runs after the component is mounted and the DOM is ready
  useEffect(() => {
    if (!terminalMounted || !terminalRef.current) return;

    // Ensure the terminal container is visible before initializing
    const containerStyle = window.getComputedStyle(terminalRef.current);
    if (containerStyle.display === 'none' || containerStyle.visibility === 'hidden' || 
        terminalRef.current.offsetHeight === 0) {
      // If terminal container is not visible yet, retry later
      const timer = setTimeout(() => setTerminalMounted(state => !state), 200);
      return () => clearTimeout(timer);
    }

    // Clear any existing terminal instance
    if (terminalRef.current.children.length > 0) {
      terminalRef.current.innerHTML = '';
    }

    // Initialize terminal with a delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      try {
        initializeTerminal();
      } catch (err) {
        console.error('Failed to initialize terminal:', err);
      }
    }, 300);

    return () => {
      clearTimeout(initTimer);
    };
  }, [terminalMounted]);

  const initializeTerminal = () => {
    if (!terminalRef.current) return;

    try {
      // Create terminal instance
      const term = new XTerm({
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
        fontSize: 14,
        cursorBlink: true,
        cursorStyle: 'block',
        allowTransparency: true,
        scrollback: 1000,
        theme: {
          background: '#1e1e2e',
          foreground: '#cdd6f4',
          cursor: '#f5e0dc',
          black: '#45475a',
          red: '#f38ba8',
          green: '#a6e3a1',
          yellow: '#f9e2af',
          blue: '#89b4fa',
          magenta: '#cba6f7',
          cyan: '#94e2d5',
          white: '#bac2de',
          brightBlack: '#585b70',
          brightRed: '#f38ba8',
          brightGreen: '#a6e3a1',
          brightYellow: '#f9e2af',
          brightBlue: '#89b4fa',
          brightMagenta: '#cba6f7',
          brightCyan: '#94e2d5',
          brightWhite: '#a6adc8',
        },
      });
      
      // Load addons before opening terminal
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(webLinksAddon);
      
      // Open terminal in the container
      term.open(terminalRef.current);
      
      // Store references
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      
      // Wait before fitting to ensure terminal is properly sized
      setTimeout(() => {
        try {
          if (fitAddonRef.current && terminalRef.current?.offsetHeight > 0) {
            fitAddonRef.current.fit();
            setIsTerminalReady(true);
            
            // Write initial content
            term.write('Deep Tree Echo Terminal\r\n');
            term.write('Type "help" for available commands, "aichat" to start AI chat\r\n\r\n');
            writePrompt();
            
            // Set up input handling
            setupInputHandling(term);
          } else {
            console.warn('Terminal container not sized properly yet');
            // Try again in a bit
            setTimeout(() => {
              if (fitAddonRef.current) {
                fitAddonRef.current.fit();
                setIsTerminalReady(true);
              }
            }, 500);
          }
        } catch (e) {
          console.error('Error fitting terminal:', e);
        }
      }, 100);
    } catch (e) {
      console.error('Error initializing terminal:', e);
    }
  };
  
  const setupInputHandling = (term: XTerm) => {
    term.onKey(({ key, domEvent }) => {
      if (streamingResponse) {
        // Only allow Ctrl+C during streaming
        if (domEvent.ctrlKey && domEvent.key === 'c') {
          setStreamingResponse(false);
          term.write('\r\n^C\r\n');
          writePrompt();
        }
        return;
      }

      // Handle special keys
      switch (domEvent.keyCode) {
        case 13: // Enter
          handleEnterKey();
          break;
        case 8: // Backspace
          handleBackspace();
          break;
        case 9: // Tab
          handleTab();
          domEvent.preventDefault();
          break;
        case 38: // Arrow Up
          handleArrowUp();
          break;
        case 40: // Arrow Down
          handleArrowDown();
          break;
        case 67: // 'c' key - Ctrl+C handling
          if (domEvent.ctrlKey) {
            term.write('\r\n^C\r\n');
            setInputBuffer('');
            writePrompt();
          } else if (!domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
            // Normal 'c' key
            term.write(key);
            setInputBuffer(prev => prev + key);
          }
          break;
        case 76: // 'l' key - Ctrl+L handling (clear screen)
          if (domEvent.ctrlKey) {
            term.clear();
            writePrompt();
          } else if (!domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
            // Normal 'l' key
            term.write(key);
            setInputBuffer(prev => prev + key);
          }
          break;
        default:
          // Only handle printable characters that aren't special keys
          const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
          if (printable && key) {
            term.write(key);
            setInputBuffer(prev => prev + key);
          }
      }
    });
  };
  
  const handleEnterKey = () => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    term.write('\r\n');
    
    const command = inputBuffer.trim();
    if (command) {
      // Add to history if not empty and not the same as the last command
      if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command) {
        setCommandHistory(prev => [...prev, command]);
      }
      
      // Process the command
      processCommand(command);
    } else {
      // Empty command, just show prompt again
      writePrompt();
    }
    
    // Reset state
    setInputBuffer('');
    setHistoryIndex(-1);
    setTabCompletions([]);
    setTabIndex(-1);
  };
  
  const handleBackspace = () => {
    if (!xtermRef.current) return;
    
    if (inputBuffer.length > 0) {
      // Delete the last character from the buffer
      setInputBuffer(prev => prev.slice(0, -1));
      
      // Delete the last character from the terminal
      xtermRef.current.write('\b \b');
    }
  };
  
  const handleTab = () => {
    if (!xtermRef.current || inputBuffer.trim() === '') return;
    
    const term = xtermRef.current;
    
    // If we already have completions, cycle through them
    if (tabCompletions.length > 0) {
      const nextIndex = (tabIndex + 1) % tabCompletions.length;
      setTabIndex(nextIndex);
      
      // Clear current input
      while (inputBuffer.length > 0) {
        term.write('\b \b');
        setInputBuffer(prev => prev.slice(0, -1));
      }
      
      // Write new completion
      term.write(tabCompletions[nextIndex]);
      setInputBuffer(tabCompletions[nextIndex]);
      return;
    }
    
    // Generate completions
    const input = inputBuffer.trim();
    const completions = availableCommands.filter(cmd => cmd.startsWith(input));
    
    if (completions.length === 1) {
      // Exact match, complete the command
      const completion = completions[0];
      const remaining = completion.slice(input.length);
      
      if (remaining.length > 0) {
        term.write(remaining);
        setInputBuffer(input + remaining);
      }
    } else if (completions.length > 1) {
      // Multiple matches, show options and set up cycling
      term.write('\r\n');
      term.write(completions.join('  ') + '\r\n');
      writePrompt();
      term.write(input);
      setInputBuffer(input);
      setTabCompletions(completions);
      setTabIndex(0);
    }
  };
  
  const handleArrowUp = () => {
    if (!xtermRef.current || commandHistory.length === 0) return;
    
    const term = xtermRef.current;
    
    // Calculate the new history index
    const newIndex = historyIndex === -1 
      ? commandHistory.length - 1 
      : Math.max(0, historyIndex - 1);
    
    setHistoryIndex(newIndex);
    
    // Clear current input
    while (inputBuffer.length > 0) {
      term.write('\b \b');
      setInputBuffer(prev => prev.slice(0, -1));
    }
    
    // Write history item
    const historyItem = commandHistory[newIndex];
    term.write(historyItem);
    setInputBuffer(historyItem);
  };
  
  const handleArrowDown = () => {
    if (!xtermRef.current || historyIndex === -1) return;
    
    const term = xtermRef.current;
    
    // Calculate the new history index
    const newIndex = historyIndex === commandHistory.length - 1 
      ? -1  // Past the end of history
      : historyIndex + 1;
    
    // Clear current input
    while (inputBuffer.length > 0) {
      term.write('\b \b');
      setInputBuffer(prev => prev.slice(0, -1));
    }
    
    if (newIndex === -1) {
      // At the end of history, show empty prompt
      setHistoryIndex(-1);
    } else {
      // Write history item
      const historyItem = commandHistory[newIndex];
      term.write(historyItem);
      setInputBuffer(historyItem);
      setHistoryIndex(newIndex);
    }
  };
  
  const writePrompt = () => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    
    // Write username and current directory
    term.write('\x1b[32mecho\x1b[0m@\x1b[34mdeeptree\x1b[0m:');
    term.write(`\x1b[36m${currentDirectory}\x1b[0m$ `);
  };
  
  // Function to be exposed to the orchestrator for external terminal command execution
  const executeTerminalCommand = async (command: string): Promise<string> => {
    if (!xtermRef.current) {
      return "Terminal not initialized";
    }
    
    // Capture the output in a string
    let output = '';
    
    // Store the original write function
    const originalWrite = xtermRef.current.write;
    
    // Override the write function to capture output
    xtermRef.current.write = (data: string | Uint8Array) => {
      // Convert to string if it's a Uint8Array
      const strData = typeof data === 'string' ? data : new TextDecoder().decode(data);
      
      // Add to our output string, removing terminal control sequences
      // This is a simple approach and might not catch all control sequences
      const cleanData = strData.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      output += cleanData;
      
      // Call the original write function
      return originalWrite.call(xtermRef.current, data);
    };
    
    // Write the command to the terminal
    xtermRef.current.write(`\r\n${command}\r\n`);
    
    // Process the command
    await processCommand(command);
    
    // Restore the original write function
    xtermRef.current.write = originalWrite;
    
    // Clean up the output string (remove prompt, command, etc.)
    // This is a simple approach and might need refining
    let cleanOutput = output
      .replace(command, '') // Remove the command itself
      .replace(/echo@deeptree:.+\$\s*/g, '') // Remove prompt
      .trim();
    
    return cleanOutput;
  };
  
  const processCommand = async (command: string) => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    const args = command.split(' ').filter(arg => arg.trim().length > 0);
    const cmd = args[0]?.toLowerCase();
    
    // Simple command processor
    switch (cmd) {
      case 'help':
        showHelp();
        break;
      case 'clear':
        term.clear();
        break;
      case 'echo':
        echoCommand(args);
        break;
      case 'memory':
        memoryCommand(args);
        break;
      case 'cd':
        cdCommand(args);
        break;
      case 'ls':
        lsCommand(args);
        break;
      case 'pwd':
        term.write(`${currentDirectory}\r\n`);
        writePrompt();
        break;
      case 'aichat':
      case 'ai':
        aiChatCommand(args);
        break;
      case 'prompt':
      case 'prompts':
        promptCommand(args);
        break;
      case 'mkdir':
        term.write(`mkdir: command simulated (would create directory: ${args[1] || ''})\r\n`);
        writePrompt();
        break;
      case 'touch':
        term.write(`touch: command simulated (would create file: ${args[1] || ''})\r\n`);
        writePrompt();
        break;
      case '':
        // Empty command, just show prompt
        writePrompt();
        break;
      default:
        term.write(`Command not found: ${cmd}\r\n`);
        term.write('Type "help" for available commands\r\n');
        writePrompt();
    }
  };
  
  const showHelp = () => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    term.write('\r\n\x1b[1mAvailable commands:\x1b[0m\r\n\r\n');
    
    const helpText = [
      { cmd: 'help', desc: 'Show this help' },
      { cmd: 'clear', desc: 'Clear the terminal' },
      { cmd: 'echo [text]', desc: 'Display text' },
      { cmd: 'ls [path]', desc: 'List files (simulated)' },
      { cmd: 'pwd', desc: 'Print working directory' },
      { cmd: 'cd [path]', desc: 'Change directory (simulated)' },
      { cmd: 'mkdir [dir]', desc: 'Create directory (simulated)' },
      { cmd: 'touch [file]', desc: 'Create file (simulated)' },
      { cmd: 'memory', desc: 'Show memory system status' },
      { cmd: 'aichat [message]', desc: 'Chat with AI (use -h for more options)' },
      { cmd: 'ai [message]', desc: 'Shorthand for aichat' },
      { cmd: 'prompt list', desc: 'List available prompt templates' },
      { cmd: 'prompt use [name]', desc: 'Use a specific prompt template' },
      { cmd: 'prompt add [name] [content]', desc: 'Add a new prompt template' }
    ];
    
    helpText.forEach(({ cmd, desc }) => {
      term.write(`  \x1b[33m${cmd.padEnd(20)}\x1b[0m ${desc}\r\n`);
    });
    
    term.write('\r\nTab completion is available for commands.\r\n');
    term.write('Up/Down arrows navigate command history.\r\n');
    term.write('\r\n\x1b[1mAI Chat Commands:\x1b[0m\r\n');
    term.write('  \x1b[33maichat -h\x1b[0m               Show AI chat help\r\n');
    term.write('  \x1b[33maichat Hello\x1b[0m             Chat with AI\r\n');
    term.write('  \x1b[33maichat -t 0.7 Hello\x1b[0m      Set temperature\r\n');
    term.write('  \x1b[33maichat -m gpt-4 Hello\x1b[0m    Specify model\r\n');
    term.write('  \x1b[33maichat -p code Hello\x1b[0m     Use code prompt template\r\n');
    term.write('  \x1b[33maichat -r\x1b[0m                Reset current chat\r\n');
    term.write('  \x1b[33maichat -c mychat Hello\x1b[0m   Create/use named chat\r\n');
    term.write('  \x1b[33maichat -e Hello\x1b[0m          Use enhanced memory context\r\n');
    term.write('\r\n');
    
    writePrompt();
  };
  
  const echoCommand = (args: string[]) => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    // Skip the first arg (the command itself) and join the rest
    const text = args.slice(1).join(' ');
    if (text) {
      term.write(`${text}\r\n`);
    }
    writePrompt();
  };
  
  const memoryCommand = (args: string[]) => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    
    if (args.length === 1) {
      // Just 'memory' command
      if (aiChat.isInitialized()) {
        term.write('Memory system active. Current status: operational\r\n');
        term.write(`Current chat: \x1b[36m${currentChat}\x1b[0m\r\n`);
        term.write(`AI integration: \x1b[32menabled\x1b[0m\r\n`);
        
        // Show chat history statistics
        const history = aiChat.getChatHistory(currentChat);
        term.write(`Messages in current chat: ${history.length}\r\n`);
      } else {
        term.write('Memory system status: API key not configured\r\n');
        term.write('Configure OpenAI API key to enable AI chat features\r\n');
      }
    } else if (args[1] === 'clear') {
      aiChat.clearChat(currentChat);
      term.write(`Cleared chat history for "${currentChat}"\r\n`);
    } else if (args[1] === 'list') {
      // List memory (simulated)
      term.write('Available memory records (simulated):\r\n');
      term.write('  - Echo state memory block (active)\r\n');
      term.write('  - Neural pattern storage (32 records)\r\n');
      term.write('  - Hypergraph connections (128 nodes)\r\n');
    }
    
    writePrompt();
  };
  
  const cdCommand = (args: string[]) => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    
    if (args.length === 1) {
      // Just 'cd' command without arguments
      setCurrentDirectory('/home/project');
    } else {
      const path = args[1];
      
      // Handle relative and absolute paths (simplified)
      if (path.startsWith('/')) {
        // Absolute path
        setCurrentDirectory(path);
      } else if (path === '..') {
        // Go up one directory
        const parts = currentDirectory.split('/').filter(p => p);
        if (parts.length > 0) {
          parts.pop();
        }
        setCurrentDirectory('/' + parts.join('/'));
      } else {
        // Append to current path (simplified)
        setCurrentDirectory(`${currentDirectory}/${path}`);
      }
    }
    
    writePrompt();
  };
  
  const lsCommand = (args: string[]) => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    
    // Simulated directory listing
    term.write('\x1b[1;34mdir1\x1b[0m  \x1b[1;34mdir2\x1b[0m  \x1b[1;34mnodes\x1b[0m  \x1b[1;32mfile.txt\x1b[0m  \x1b[1;32mREADME.md\x1b[0m\r\n');
    writePrompt();
  };
  
  const aiChatCommand = async (args: string[]) => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    
    // If no API key, inform the user
    if (!aiChat.isInitialized()) {
      term.write('\x1b[33mAPI key not configured. AI chat features are disabled.\x1b[0m\r\n');
      term.write('Configure OpenAI API key in Chat settings\r\n');
      writePrompt();
      return;
    }
    
    if (args.length === 1) {
      // Just 'aichat' command without arguments
      term.write('AI Chat is ready. Type "aichat [your message]" to chat.\r\n');
      term.write('Type "aichat -h" for help.\r\n');
      writePrompt();
      return;
    }
    
    if (args[1] === '-h' || args[1] === '--help') {
      // Show AI chat help
      term.write('\r\n\x1b[1mAI Chat Commands:\x1b[0m\r\n');
      term.write('  \x1b[33maichat [message]\x1b[0m            Send message to AI\r\n');
      term.write('  \x1b[33maichat -t 0.7 [message]\x1b[0m     Set temperature (0.0-1.0)\r\n');
      term.write('  \x1b[33maichat -m gpt-4 [message]\x1b[0m   Set model (gpt-4, gpt-3.5-turbo)\r\n');
      term.write('  \x1b[33maichat -p code [message]\x1b[0m    Use code prompt template\r\n');
      term.write('  \x1b[33maichat -r\x1b[0m                   Reset current chat\r\n');
      term.write('  \x1b[33maichat -c mychat [message]\x1b[0m  Create/use named chat\r\n');
      term.write('  \x1b[33maichat -e [message]\x1b[0m         Use enhanced memory context\r\n');
      term.write('\r\n');
      writePrompt();
      return;
    }
    
    if (args[1] === '-r' || args[1] === '--reset') {
      // Reset current chat
      aiChat.clearChat(currentChat);
      term.write(`Chat "${currentChat}" has been reset.\r\n`);
      writePrompt();
      return;
    }
    
    // Parse options
    let messageStartIndex = 1;
    let temperature = 0.7;
    let model = 'gpt-4-turbo';
    let promptTemplate = 'default';
    let useEnhancedContext = false;
    
    while (messageStartIndex < args.length) {
      const arg = args[messageStartIndex];
      
      if (arg === '-t' || arg === '--temperature') {
        if (messageStartIndex + 1 < args.length) {
          const tempValue = parseFloat(args[messageStartIndex + 1]);
          if (!isNaN(tempValue) && tempValue >= 0 && tempValue <= 1) {
            temperature = tempValue;
            messageStartIndex += 2;
          } else {
            term.write(`Invalid temperature value: ${args[messageStartIndex + 1]}. Using default.\r\n`);
            messageStartIndex += 2;
          }
        } else {
          term.write('Missing temperature value. Using default.\r\n');
          messageStartIndex += 1;
        }
      } else if (arg === '-m' || arg === '--model') {
        if (messageStartIndex + 1 < args.length) {
          const modelArg = args[messageStartIndex + 1];
          if (['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'].includes(modelArg)) {
            model = modelArg;
            messageStartIndex += 2;
          } else {
            term.write(`Invalid model: ${modelArg}. Using default.\r\n`);
            messageStartIndex += 2;
          }
        } else {
          term.write('Missing model value. Using default.\r\n');
          messageStartIndex += 1;
        }
      } else if (arg === '-p' || arg === '--prompt') {
        if (messageStartIndex + 1 < args.length) {
          const templateName = args[messageStartIndex + 1];
          const template = aiChat.getPromptTemplate(templateName);
          if (template) {
            promptTemplate = templateName;
            messageStartIndex += 2;
          } else {
            term.write(`Prompt template "${templateName}" not found. Using default.\r\n`);
            messageStartIndex += 2;
          }
        } else {
          term.write('Missing prompt template name. Using default.\r\n');
          messageStartIndex += 1;
        }
      } else if (arg === '-c' || arg === '--chat') {
        if (messageStartIndex + 1 < args.length) {
          const chatName = args[messageStartIndex + 1];
          setCurrentChat(chatName);
          aiChat.createChat(chatName);
          term.write(`Using chat: ${chatName}\r\n`);
          messageStartIndex += 2;
        } else {
          term.write('Missing chat name. Using current chat.\r\n');
          messageStartIndex += 1;
        }
      } else if (arg === '-e' || arg === '--enhanced') {
        useEnhancedContext = true;
        messageStartIndex += 1;
      } else {
        // Not an option, must be the start of the message
        break;
      }
    }
    
    // Extract the message
    const message = args.slice(messageStartIndex).join(' ');
    
    if (!message.trim()) {
      term.write('No message provided.\r\n');
      writePrompt();
      return;
    }
    
    try {
      // Show user message
      term.write(`\r\n\x1b[36mYou:\x1b[0m ${message}\r\n\r\n`);
      
      // Display thinking indicator
      term.write('\x1b[33mAI is thinking...\x1b[0m');
      
      // Set streaming flag
      setStreamingResponse(true);
      
      // Send the message with streaming
      if (useEnhancedContext) {
        // Use enhanced memory context
        await aiChat.sendEnhancedMessage(currentChat, message, {
          temperature,
          model: model as any,
          systemPrompt: aiChat.getPromptTemplate(promptTemplate) || undefined,
          stream: true,
          onStream: (chunk) => {
            // Delete the "thinking" message on first chunk
            if (xtermRef.current) {
              // Clear the "AI is thinking..." message
              if (chunk === xtermRef.current.buffer.active.getLine(xtermRef.current.buffer.active.length - 1)?.translateToString().substring(0, 1)) {
                xtermRef.current.write('\r\x1b[K');
              }
              xtermRef.current.write(chunk);
            }
          }
        });
      } else {
        // Use regular chat
        await aiChat.sendMessage(currentChat, message, {
          temperature,
          model: model as any,
          systemPrompt: aiChat.getPromptTemplate(promptTemplate) || undefined,
          stream: true,
          onStream: (chunk) => {
            // Delete the "thinking" message on first chunk
            if (xtermRef.current) {
              // Clear the "AI is thinking..." message
              if (chunk === xtermRef.current.buffer.active.getLine(xtermRef.current.buffer.active.length - 1)?.translateToString().substring(0, 1)) {
                xtermRef.current.write('\r\x1b[K');
              }
              xtermRef.current.write(chunk);
            }
          }
        });
      }
      
      // End of response
      term.write('\r\n\r\n');
    } catch (error: unknown) {
      term.write('\r\x1b[K'); // Clear the "thinking" line
      term.write(`\x1b[31mError: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m\r\n`);
    } finally {
      setStreamingResponse(false);
      writePrompt();
    }
  };
  
  const promptCommand = (args: string[]) => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    
    if (args.length === 1 || args[1] === 'list') {
      // List all prompts
      term.write('\r\n\x1b[1mAvailable prompt templates:\x1b[0m\r\n\r\n');
      const templates = aiChat.getPromptTemplates();
      
      templates.forEach(template => {
        term.write(`\x1b[33m${template.name}\x1b[0m\r\n`);
        term.write(`  ${template.content.substring(0, 70)}${template.content.length > 70 ? '...' : ''}\r\n\r\n`);
      });
    } else if (args[1] === 'use' && args.length > 2) {
      // Use a prompt template
      const templateName = args[2];
      const template = aiChat.getPromptTemplate(templateName);
      
      if (template) {
        term.write(`Using prompt template: \x1b[33m${templateName}\x1b[0m\r\n`);
      } else {
        term.write(`Prompt template "${templateName}" not found.\r\n`);
      }
    } else if (args[1] === 'add' && args.length > 3) {
      // Add a new prompt template
      const templateName = args[2];
      const templateContent = args.slice(3).join(' ');
      
      aiChat.addPromptTemplate(templateName, templateContent);
      term.write(`Added prompt template: \x1b[33m${templateName}\x1b[0m\r\n`);
    } else {
      term.write('Usage:\r\n');
      term.write('  prompt list                    List all prompt templates\r\n');
      term.write('  prompt use [name]              Use a specific prompt template\r\n');
      term.write('  prompt add [name] [content]    Add a new prompt template\r\n');
    }
    
    writePrompt();
  };
  
  // Set up resize handling with debouncing to prevent resize loops
  useEffect(() => {
    if (!isTerminalReady) return;
    
    let resizeTimeout: NodeJS.Timeout | null = null;
    
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        if (fitAddonRef.current && terminalRef.current?.offsetHeight > 0) {
          try {
            fitAddonRef.current.fit();
          } catch (e) {
            console.error('Error resizing terminal:', e);
          }
        }
      }, 100); // Debounce resize events
    };
    
    // Create a resize observer that uses the debounced handler
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }
    
    // Also handle window resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isTerminalReady]);
  
  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-card text-card-foreground px-4 py-2 border-b border-border flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium">Terminal</span>
          {streamingResponse && (
            <span className="ml-3 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded animate-pulse">
              AI Processing...
            </span>
          )}
        </div>
        <div className="text-xs opacity-70">
          {aiChat.isInitialized() ? 
            <span className="text-green-400">AI Ready</span> : 
            <span>AI Disabled</span>
          }
        </div>
      </div>
      <div ref={terminalRef} className="flex-1" />
    </div>
  );
};

export default Terminal;