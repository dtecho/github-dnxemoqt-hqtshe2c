import { exec } from 'child_process';
import { promisify } from 'util';
import { getFileSystemService } from './fileSystem.server';

const execAsync = promisify(exec);

export class ScriptRunnerService {
  private static instance: ScriptRunnerService;
  private fileSystem = getFileSystemService();
  
  private constructor() {}
  
  public static getInstance(): ScriptRunnerService {
    if (!ScriptRunnerService.instance) {
      ScriptRunnerService.instance = new ScriptRunnerService();
    }
    return ScriptRunnerService.instance;
  }
  
  public async runNodeScript(script: string): Promise<string> {
    try {
      // Write script to a temporary file
      const tempFile = '/tmp/script.js';
      this.fileSystem.writeFile(tempFile, script);
      
      // Run the script with Node.js
      const { stdout, stderr } = await execAsync(`node ${tempFile}`);
      
      if (stderr) {
        return `Error: ${stderr}`;
      }
      
      return stdout;
    } catch (error) {
      return `Error executing Node.js script: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  public async runPythonScript(script: string): Promise<string> {
    try {
      // Write script to a temporary file
      const tempFile = '/tmp/script.py';
      this.fileSystem.writeFile(tempFile, script);
      
      // Run the script with Python
      const { stdout, stderr } = await execAsync(`python3 ${tempFile}`);
      
      if (stderr) {
        return `Error: ${stderr}`;
      }
      
      return stdout;
    } catch (error) {
      return `Error executing Python script: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  public async runNpmCommand(command: string, args: string[]): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`npm ${command} ${args.join(' ')}`);
      
      if (stderr && !stderr.includes('npm notice')) {
        return `Error: ${stderr}`;
      }
      
      return stdout;
    } catch (error) {
      return `Error executing npm command: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

// Create a server-side script runner service instance
let scriptRunnerService: ScriptRunnerService | null = null;

export const getScriptRunnerService = () => {
  if (!scriptRunnerService) {
    scriptRunnerService = ScriptRunnerService.getInstance();
  }
  return scriptRunnerService;
};