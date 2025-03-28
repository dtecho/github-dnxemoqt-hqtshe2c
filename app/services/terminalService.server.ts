import { spawn } from 'child_process';
import { getFileSystemService } from './fileSystem.server';
import { getScriptRunnerService } from './scriptRunner.server';
import { getPythonRunnerService } from './pythonRunner.server';

export class TerminalService {
  private static instance: TerminalService;
  private fs = getFileSystemService();
  private scriptRunner = getScriptRunnerService();
  private pythonRunner = getPythonRunnerService();
  
  private constructor() {}
  
  public static getInstance(): TerminalService {
    if (!TerminalService.instance) {
      TerminalService.instance = new TerminalService();
    }
    return TerminalService.instance;
  }
  
  public async executeCommand(command: string): Promise<string> {
    try {
      // Parse command and arguments
      const args = command.split(' ');
      const cmd = args[0].toLowerCase();
      
      switch (cmd) {
        case 'help':
          return this.getHelpText();
        case 'clear':
          return '\x1bc'; // ANSI clear screen
        case 'echo':
          return args.slice(1).join(' ') + '\n';
        case 'pwd':
          return this.fs.getCurrentDirectory() + '\n';
        case 'ls':
          return this.handleLs(args);
        case 'cd':
          return this.handleCd(args);
        case 'node':
          return this.handleNode(args);
        case 'python':
          return this.handlePython(args);
        case 'npm':
          return this.handleNpm(args);
        case 'version':
          return this.getVersionInfo();
        default:
          return `Command not found: ${cmd}\nType 'help' for available commands\n`;
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
    }
  }
  
  private getHelpText(): string {
    return `
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
\n`;
  }
  
  private async getVersionInfo(): Promise<string> {
    const pythonVersion = await this.pythonRunner.getVersion();
    return `Deep Tree Echo Terminal v1.0.0\nNode.js ${process.version}\n${pythonVersion}\n`;
  }
  
  private handleLs(args: string[]): string {
    const path = args[1] || this.fs.getCurrentDirectory();
    const long = args.includes('-l');
    return this.fs.listDirectory(path, { long }).join('\n') + '\n';
  }
  
  private handleCd(args: string[]): string {
    const newPath = args[1] || '/home/project';
    return this.fs.changeDirectory(newPath) + '\n';
  }
  
  private async handleNode(args: string[]): Promise<string> {
    if (!args[1]) {
      return 'Error: Please specify a JavaScript file to run\n';
    }
    
    const script = this.fs.readFile(args[1]);
    if (!script) {
      return `Error: File not found: ${args[1]}\n`;
    }
    
    return await this.scriptRunner.runNodeScript(script) + '\n';
  }
  
  private async handlePython(args: string[]): Promise<string> {
    if (!args[1]) {
      return 'Error: Please specify a Python file to run\n';
    }
    
    const script = this.fs.readFile(args[1]);
    if (!script) {
      return `Error: File not found: ${args[1]}\n`;
    }
    
    return await this.pythonRunner.runScript(script) + '\n';
  }
  
  private async handleNpm(args: string[]): Promise<string> {
    if (args.length < 2) {
      return 'Error: Please specify an npm command\n';
    }
    
    return await this.scriptRunner.runNpmCommand(args[1], args.slice(2)) + '\n';
  }
}

// Create a server-side terminal service instance
let terminalService: TerminalService | null = null;

export const getTerminalService = () => {
  if (!terminalService) {
    terminalService = TerminalService.getInstance();
  }
  return terminalService;
};