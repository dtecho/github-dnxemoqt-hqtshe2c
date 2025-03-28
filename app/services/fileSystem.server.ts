import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface VirtualFile {
  name: string;
  content: string;
  type: 'file' | 'directory';
  createdAt: string;
  updatedAt: string;
  permissions: string;
  owner: string;
  group: string;
  size: number;
}

export class FileSystemService {
  private static instance: FileSystemService;
  private root: string = '/home/project';
  private files: Map<string, VirtualFile> = new Map();
  
  private constructor() {
    this.initializeFileSystem();
  }
  
  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }
  
  private initializeFileSystem() {
    // Initialize with some default files and directories
    this.createFile('/home/project/package.json', readFileSync('package.json', 'utf-8'));
    this.createFile('/home/project/README.md', readFileSync('README.md', 'utf-8'));
    this.createFile('/home/project/tsconfig.json', readFileSync('tsconfig.json', 'utf-8'));
    this.createFile('/home/project/vite.config.ts', readFileSync('vite.config.ts', 'utf-8'));
    
    // Create app directory
    this.createDirectory('/home/project/app');
    
    // Create src directory with some example files
    this.createDirectory('/home/project/src');
    this.createFile('/home/project/src/main.ts', `
console.log('Hello from Deep Tree Echo!');

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));
`);
    
    // Create examples directory with Python files
    this.createDirectory('/home/project/examples');
    this.createFile('/home/project/examples/hello.py', `
print("Hello from Deep Tree Echo!")

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("Factorial(5):", factorial(5))
`);
  }
  
  public createFile(path: string, content: string): void {
    const now = new Date().toISOString();
    this.files.set(path, {
      name: path.split('/').pop() || '',
      content,
      type: 'file',
      createdAt: now,
      updatedAt: now,
      permissions: '-rw-r--r--',
      owner: 'user',
      group: 'staff',
      size: content.length
    });
  }
  
  public createDirectory(path: string): void {
    const now = new Date().toISOString();
    this.files.set(path, {
      name: path.split('/').pop() || '',
      content: '',
      type: 'directory',
      createdAt: now,
      updatedAt: now,
      permissions: 'drwxr-xr-x',
      owner: 'user',
      group: 'staff',
      size: 4096
    });
  }
  
  public readFile(path: string): string | null {
    const file = this.files.get(path);
    if (file?.type === 'file') {
      return file.content;
    }
    return null;
  }
  
  public writeFile(path: string, content: string): void {
    const file = this.files.get(path);
    if (file) {
      file.content = content;
      file.updatedAt = new Date().toISOString();
      file.size = content.length;
    } else {
      this.createFile(path, content);
    }
  }
  
  public listDirectory(path: string, options: { long?: boolean } = {}): string[] {
    const entries: string[] = [];
    
    for (const [filePath, file] of this.files.entries()) {
      if (filePath.startsWith(path) && filePath !== path) {
        const relativePath = filePath.slice(path.length + 1).split('/')[0];
        if (relativePath && !entries.includes(relativePath)) {
          if (options.long) {
            entries.push(`${file.permissions} ${file.owner} ${file.group} ${file.size.toString().padStart(8)} ${new Date(file.updatedAt).toLocaleString()} ${relativePath}`);
          } else {
            entries.push(relativePath);
          }
        }
      }
    }
    
    return entries;
  }
  
  public exists(path: string): boolean {
    return this.files.has(path);
  }
  
  public isDirectory(path: string): boolean {
    const file = this.files.get(path);
    return file?.type === 'directory';
  }
  
  public delete(path: string): void {
    this.files.delete(path);
  }
  
  public move(oldPath: string, newPath: string): void {
    const file = this.files.get(oldPath);
    if (file) {
      this.files.set(newPath, {
        ...file,
        name: newPath.split('/').pop() || '',
        updatedAt: new Date().toISOString()
      });
      this.files.delete(oldPath);
    }
  }
  
  public copy(sourcePath: string, destPath: string): void {
    const file = this.files.get(sourcePath);
    if (file) {
      this.files.set(destPath, {
        ...file,
        name: destPath.split('/').pop() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  public getCurrentDirectory(): string {
    return this.root;
  }
  
  public changeDirectory(path: string): string {
    if (path.startsWith('/')) {
      // Absolute path
      if (this.exists(path) && this.isDirectory(path)) {
        this.root = path;
      }
    } else if (path === '..') {
      // Go up one directory
      const parentDir = dirname(this.root);
      if (parentDir !== this.root) {
        this.root = parentDir;
      }
    } else {
      // Relative path
      const newPath = join(this.root, path);
      if (this.exists(newPath) && this.isDirectory(newPath)) {
        this.root = newPath;
      }
    }
    return this.root;
  }
}

// Create a server-side file system service instance
let fileSystemService: FileSystemService | null = null;

export const getFileSystemService = () => {
  if (!fileSystemService) {
    fileSystemService = FileSystemService.getInstance();
  }
  return fileSystemService;
};