import { PythonShell } from 'python-shell';
import { getFileSystemService } from './fileSystem.server';

export class PythonRunnerService {
  private static instance: PythonRunnerService;
  private fileSystem = getFileSystemService();
  
  private constructor() {}
  
  public static getInstance(): PythonRunnerService {
    if (!PythonRunnerService.instance) {
      PythonRunnerService.instance = new PythonRunnerService();
    }
    return PythonRunnerService.instance;
  }
  
  public async runScript(script: string): Promise<string> {
    try {
      // Write script to a temporary file
      const tempFile = '/tmp/script.py';
      this.fileSystem.writeFile(tempFile, script);
      
      // Run the script with Python Shell
      const options = {
        mode: 'text',
        pythonPath: 'python3',
        pythonOptions: ['-u'], // unbuffered output
      };
      
      return new Promise((resolve, reject) => {
        let output: string[] = [];
        let error: string[] = [];
        
        PythonShell.run(tempFile, options)
          .then(messages => {
            output = messages;
            resolve(output.join('\n'));
          })
          .catch(err => {
            error.push(err.message);
            resolve(`Error: ${error.join('\n')}`);
          });
      });
    } catch (error) {
      return `Error executing Python script: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  public async executeREPL(code: string): Promise<string> {
    try {
      // Create a temporary Python script that executes the code
      const script = `
import sys
from io import StringIO

# Capture stdout
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

try:
    # Execute the code
    exec(${JSON.stringify(code)})
    output = mystdout.getvalue()
except Exception as e:
    output = f"Error: {str(e)}"

# Restore stdout
sys.stdout = old_stdout
print(output, end='')
`;
      
      return this.runScript(script);
    } catch (error) {
      return `Error in Python REPL: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  public async getVersion(): Promise<string> {
    try {
      const options = {
        mode: 'text',
        pythonPath: 'python3',
        pythonOptions: ['-V'],
      };
      
      return new Promise((resolve) => {
        PythonShell.run('', options)
          .then(messages => {
            resolve(messages.join('\n'));
          })
          .catch(err => {
            resolve(`Error getting Python version: ${err.message}`);
          });
      });
    } catch (error) {
      return `Error getting Python version: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

// Create a server-side Python runner service instance
let pythonRunnerService: PythonRunnerService | null = null;

export const getPythonRunnerService = () => {
  if (!pythonRunnerService) {
    pythonRunnerService = PythonRunnerService.getInstance();
  }
  return pythonRunnerService;
};