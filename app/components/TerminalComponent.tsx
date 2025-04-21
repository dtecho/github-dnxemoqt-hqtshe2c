import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

interface TerminalComponentProps {
  onCommand?: (command: string) => void;
  initialOutput?: string[];
  commandHistory?: string[];
  isBusy?: boolean;
}

const TerminalComponent: React.FC<TerminalComponentProps> = ({
  onCommand,
  initialOutput = [],
  commandHistory = [],
  isBusy = false
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isTerminalReady, setIsTerminalReady] = useState<boolean>(false);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showHelp, setShowHelp] = useState<boolean>(false); // New feature state

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;
    
    try {
      // Create terminal instance
      const term = new Terminal({
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
        fontSize: 14,
        cursorBlink: true,
        cursorStyle: 'block',
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
        },
      });
      
      // Load addons
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(webLinksAddon);
      
      // Open terminal in the container
      term.open(terminalRef.current);
      
      // Store references
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      
      // Set up input handling
      term.onKey(({ key, domEvent }) => {
        if (isBusy) {
          // Only allow Ctrl+C during busy state
          if (domEvent.ctrlKey && domEvent.key === 'c') {
            term.write('^C\r\n');
            writePrompt();
          }
          return;
        }
        
        switch (domEvent.keyCode) {
          case 13: // Enter
            handleEnterKey();
            break;
          case 8: // Backspace
            handleBackspace();
            break;
          case 9: // Tab
            handleTab();
            break;
          case 38: // Arrow Up
            handleArrowUp();
            break;
          case 40: // Arrow Down
            handleArrowDown();
            break;
          case 67: // 'c' key
            if (domEvent.ctrlKey) {
              term.write('^C\r\n');
              setInputBuffer('');
              writePrompt();
            } else {
              term.write(key);
              setInputBuffer(prev => prev + key);
            }
            break;
          case 72: // 'h' key
            if (domEvent.ctrlKey) {
              setShowHelp(prev => !prev); // Toggle help display
            } else {
              term.write(key);
              setInputBuffer(prev => prev + key);
            }
            break;
          case 76: // 'l' key
            if (domEvent.ctrlKey) {
              term.clear();
              writePrompt();
            } else {
              term.write(key);
              setInputBuffer(prev => prev + key);
            }
            break;
          default:
            // Handle regular input
            if (!domEvent.ctrlKey && !domEvent.altKey) {
              term.write(key);
              setInputBuffer(prev => prev + key);
            }
        }
      });
      
      // Initial setup
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
          setIsTerminalReady(true);
          
          // Write initial output
          initialOutput.forEach(line => {
            term.write(line + '\r\n');
          });
          writePrompt();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing terminal:', error);
    }
  }, []);
  
  const writePrompt = () => {
    if (!xtermRef.current) return;
    xtermRef.current.write('\r\n$ ');
  };
  
  const handleEnterKey = () => {
    if (!xtermRef.current) return;
    
    const command = inputBuffer.trim();
    if (command && onCommand) {
      onCommand(command);
    }
    
    setInputBuffer('');
    setHistoryIndex(-1);
  };
  
  const handleBackspace = () => {
    if (!xtermRef.current || inputBuffer.length === 0) return;
    
    xtermRef.current.write('\b \b');
    setInputBuffer(prev => prev.slice(0, -1));
  };
  
  const handleTab = () => {
    // Simple command completion
    if (!xtermRef.current || !inputBuffer) return;
    
    const commands = [
      'help', 'clear', 'echo', 'ls', 'pwd', 'cd',
      'node', 'python', 'npm', 'version'
    ];
    
    const matches = commands.filter(cmd => cmd.startsWith(inputBuffer));
    
    if (matches.length === 1) {
      // Complete the command
      const completion = matches[0].slice(inputBuffer.length);
      xtermRef.current.write(completion);
      setInputBuffer(matches[0]);
    } else if (matches.length > 1) {
      // Show available completions
      xtermRef.current.write('\r\n');
      xtermRef.current.write(matches.join('  ') + '\r\n');
      writePrompt();
      xtermRef.current.write(inputBuffer);
    }
  };
  
  const handleArrowUp = () => {
    if (!xtermRef.current || commandHistory.length === 0) return;
    
    const newIndex = historyIndex === -1 
      ? commandHistory.length - 1 
      : Math.max(0, historyIndex - 1);
    
    // Clear current input
    while (inputBuffer.length > 0) {
      xtermRef.current.write('\b \b');
      setInputBuffer(prev => prev.slice(0, -1));
    }
    
    // Write history item
    const historyItem = commandHistory[newIndex];
    xtermRef.current.write(historyItem);
    setInputBuffer(historyItem);
    setHistoryIndex(newIndex);
  };
  
  const handleArrowDown = () => {
    if (!xtermRef.current || historyIndex === -1) return;
    
    const newIndex = historyIndex === commandHistory.length - 1 
      ? -1 
      : historyIndex + 1;
    
    // Clear current input
    while (inputBuffer.length > 0) {
      xtermRef.current.write('\b \b');
      setInputBuffer(prev => prev.slice(0, -1));
    }
    
    if (newIndex === -1) {
      setHistoryIndex(-1);
    } else {
      const historyItem = commandHistory[newIndex];
      xtermRef.current.write(historyItem);
      setInputBuffer(historyItem);
      setHistoryIndex(newIndex);
    }
  };
  
  // Handle terminal resize
  useEffect(() => {
    if (!isTerminalReady) return;
    
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isTerminalReady]);
  
  return (
    <div className="h-full w-full relative">
      <div ref={terminalRef} className="h-full w-full" />
      {showHelp && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/75 text-white p-4">
          <h2 className="text-lg font-bold mb-2">Terminal Help</h2>
          <p>Use the following commands to interact with the terminal:</p>
          <ul className="list-disc pl-5 mt-2">
            <li><strong>help</strong>: Show this help message</li>
            <li><strong>clear</strong>: Clear the terminal</li>
            <li><strong>echo [text]</strong>: Display text</li>
            <li><strong>ls [path]</strong>: List files</li>
            <li><strong>pwd</strong>: Print working directory</li>
            <li><strong>cd [dir]</strong>: Change directory</li>
            <li><strong>node [file]</strong>: Run Node.js script</li>
            <li><strong>python [file]</strong>: Run Python script</li>
            <li><strong>npm [command]</strong>: Run npm command</li>
            <li><strong>version</strong>: Show version info</li>
          </ul>
          <button
            onClick={() => setShowHelp(false)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default TerminalComponent;
