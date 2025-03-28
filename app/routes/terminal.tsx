import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { getFileSystemService } from "~/services/fileSystem.server";
import { getScriptRunnerService } from "~/services/scriptRunner.server";
import { getPythonRunnerService } from "~/services/pythonRunner.server";
import TerminalComponent from "~/components/TerminalComponent";

export async function loader() {
  return json({
    title: "Terminal",
    description: "Interactive command-line interface with script execution and file system simulation"
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const command = formData.get("command") as string;
  
  if (!command) {
    return json({ error: "Command is required" });
  }
  
  try {
    const fs = getFileSystemService();
    const scriptRunner = getScriptRunnerService();
    const pythonRunner = getPythonRunnerService();
    
    // Parse command and arguments
    const args = command.split(' ');
    const cmd = args[0].toLowerCase();
    
    let output = '';
    
    switch (cmd) {
      case 'help':
        output = `
Available commands:
  help                 Show this help message
  clear               Clear the terminal
  echo [text]         Display text
  ls [path]           List files
  pwd                 Print working directory
  cd [dir]            Change directory
  node [file]         Run Node.js script
  python [file]       Run Python script
  npm [command]       Run npm command
  version             Show version info
`;
        break;
        
      case 'version':
        const pythonVersion = await pythonRunner.getVersion();
        output = `Deep Tree Echo Terminal v1.0.0\nNode.js ${process.version}\n${pythonVersion}`;
        break;
        
      case 'echo':
        output = args.slice(1).join(' ');
        break;
        
      case 'pwd':
        output = fs.getCurrentDirectory();
        break;
        
      case 'ls':
        const path = args[1] || fs.getCurrentDirectory();
        const long = args.includes('-l');
        output = fs.listDirectory(path, { long }).join('\n');
        break;
        
      case 'cd':
        const newPath = args[1] || '/home/project';
        output = fs.changeDirectory(newPath);
        break;
        
      case 'node':
        if (args[1]) {
          const script = fs.readFile(args[1]);
          if (script) {
            output = await scriptRunner.runNodeScript(script);
          } else {
            output = `Error: File not found: ${args[1]}`;
          }
        } else {
          output = 'Error: Please specify a JavaScript file to run';
        }
        break;
        
      case 'python':
        if (args[1]) {
          const script = fs.readFile(args[1]);
          if (script) {
            output = await pythonRunner.runScript(script);
          } else {
            output = `Error: File not found: ${args[1]}`;
          }
        } else {
          output = 'Error: Please specify a Python file to run';
        }
        break;
        
      case 'npm':
        if (args.length > 1) {
          output = await scriptRunner.runNpmCommand(args[1], args.slice(2));
        } else {
          output = 'Error: Please specify an npm command';
        }
        break;
        
      default:
        output = `Command not found: ${cmd}\nType 'help' for available commands`;
    }
    
    return json({ output });
  } catch (error) {
    return json({ 
      error: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

export default function TerminalPage() {
  const { title, description } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [output, setOutput] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  
  // Initialize with welcome message
  useEffect(() => {
    setOutput([
      "Welcome to Deep Tree Echo Terminal",
      "Type 'help' for available commands",
      "Use Tab for command completion and Up/Down arrows for history",
      ""
    ]);
  }, []);
  
  // Update output when action data changes
  useEffect(() => {
    if (actionData?.output) {
      setOutput(prev => [...prev, actionData.output]);
    }
    if (actionData?.error) {
      setOutput(prev => [...prev, `Error: ${actionData.error}`]);
    }
  }, [actionData]);
  
  const handleCommand = async (command: string) => {
    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    
    // Add command to output
    setOutput(prev => [...prev, `$ ${command}`]);
    
    // Process the command
    try {
      setIsBusy(true);
      
      const form = new FormData();
      form.append('command', command);
      
      const response = await fetch('/terminal', {
        method: 'POST',
        body: form
      });
      
      const data = await response.json();
      if (data.output) {
        setOutput(prev => [...prev, data.output]);
      }
      if (data.error) {
        setOutput(prev => [...prev, `Error: ${data.error}`]);
      }
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsBusy(false);
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card text-card-foreground px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm opacity-70">{description}</p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <TerminalComponent
          onCommand={handleCommand}
          initialOutput={output}
          commandHistory={commandHistory}
          isBusy={isBusy}
        />
      </main>
      
      <footer className="bg-card text-card-foreground px-6 py-2 border-t border-border">
        <div className="flex justify-between items-center">
          <div className="text-xs opacity-70">
            {isBusy ? 'Processing command...' : 'Ready'}
          </div>
          <div className="text-xs opacity-70">
            <span className="font-mono">Tab</span>: completion • 
            <span className="font-mono ml-1">↑/↓</span>: history •
            <span className="font-mono ml-1">Ctrl+C</span>: cancel •
            <span className="font-mono ml-1">Ctrl+L</span>: clear
          </div>
        </div>
      </footer>
    </div>
  );
}