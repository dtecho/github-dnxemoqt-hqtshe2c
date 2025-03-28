import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileData {
  id: string;
  name: string;
  content: string;
  path: string;
  type: 'file' | 'directory';
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  currentFile: FileData | null;
  files: FileData[];
  editorType: 'monaco' | 'codemirror';
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentFile: (file: FileData | null) => void;
  addFile: (file: FileData) => void;
  updateFile: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  setEditorType: (type: 'monaco' | 'codemirror') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      currentFile: null,
      files: [],
      editorType: 'monaco',
      
      setTheme: (theme) => set({ theme }),
      setCurrentFile: (file) => set({ currentFile: file }),
      addFile: (file) => set((state) => ({ files: [...state.files, file] })),
      updateFile: (id, content) => 
        set((state) => ({
          files: state.files.map((file) => 
            file.id === id 
              ? { ...file, content, updatedAt: new Date().toISOString() } 
              : file
          ),
          currentFile: state.currentFile?.id === id
            ? { ...state.currentFile, content, updatedAt: new Date().toISOString() }
            : state.currentFile
        })),
      deleteFile: (id) => 
        set((state) => ({
          files: state.files.filter((file) => file.id !== id),
          currentFile: state.currentFile?.id === id ? null : state.currentFile
        })),
      renameFile: (id, newName) =>
        set((state) => ({
          files: state.files.map((file) => 
            file.id === id 
              ? { 
                  ...file, 
                  name: newName,
                  path: file.path.replace(/[^/]*$/, newName),
                  updatedAt: new Date().toISOString() 
                } 
              : file
          ),
          currentFile: state.currentFile?.id === id
            ? { 
                ...state.currentFile, 
                name: newName,
                path: state.currentFile.path.replace(/[^/]*$/, newName),
                updatedAt: new Date().toISOString() 
              }
            : state.currentFile
        })),
      setEditorType: (editorType) => set({ editorType }),
    }),
    {
      name: 'deep-tree-echo-storage',
    }
  )
);