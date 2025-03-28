import { useState } from 'react';
import { FiFile, FiFolder, FiFolderPlus, FiFilePlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { useAppStore, FileData } from '../store/appStore';

const FileExplorer = () => {
  const { files, addFile, deleteFile, setCurrentFile, currentFile, renameFile } = useAppStore();
  const [newFileName, setNewFileName] = useState<string>('');
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState<string>('');

  const handleCreateFile = () => {
    if (newFileName.trim() === '') return;
    
    const newFile: FileData = {
      id: `file_${Date.now()}`,
      name: newFileName,
      content: '',
      path: `/${newFileName}`,
      type: 'file',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addFile(newFile);
    setNewFileName('');
    setIsCreatingFile(false);
  };

  const handleCreateFolder = () => {
    if (newFileName.trim() === '') return;
    
    const newFolder: FileData = {
      id: `folder_${Date.now()}`,
      name: newFileName,
      content: '',
      path: `/${newFileName}`,
      type: 'directory',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addFile(newFolder);
    setNewFileName('');
    setIsCreatingFolder(false);
  };

  const handleFileClick = (file: FileData) => {
    if (file.type === 'file') {
      setCurrentFile(file);
    }
  };

  const handleFileRename = (id: string) => {
    if (editFileName.trim() === '') return;
    
    renameFile(id, editFileName);
    setEditingFileId(null);
    setEditFileName('');
  };

  const sortedFiles = [...files].sort((a, b) => {
    // Directories first, then files
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    
    // Alphabetical sorting within same type
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-card text-card-foreground px-4 py-2 border-b border-border flex justify-between items-center">
        <span>Files</span>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setIsCreatingFile(true);
              setIsCreatingFolder(false);
            }}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="New File"
          >
            <FiFilePlus size={18} />
          </button>
          <button
            onClick={() => {
              setIsCreatingFolder(true);
              setIsCreatingFile(false);
            }}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="New Folder"
          >
            <FiFolderPlus size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isCreatingFile && (
          <div className="mb-2 p-2 bg-card/30 rounded-md">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name (with extension)"
              className="w-full mb-2 bg-input border border-border rounded-md px-2 py-1 text-sm"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsCreatingFile(false)}
                className="px-2 py-1 text-xs rounded-md border border-border hover:bg-card/80"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFile}
                className="px-2 py-1 text-xs rounded-md bg-primary/90 hover:bg-primary text-white"
              >
                Create
              </button>
            </div>
          </div>
        )}
        
        {isCreatingFolder && (
          <div className="mb-2 p-2 bg-card/30 rounded-md">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Folder name"
              className="w-full mb-2 bg-input border border-border rounded-md px-2 py-1 text-sm"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsCreatingFolder(false)}
                className="px-2 py-1 text-xs rounded-md border border-border hover:bg-card/80"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                className="px-2 py-1 text-xs rounded-md bg-primary/90 hover:bg-primary text-white"
              >
                Create
              </button>
            </div>
          </div>
        )}
        
        <ul className="space-y-1">
          {sortedFiles.map((file) => (
            <li 
              key={file.id}
              className={`flex items-center justify-between p-2 rounded-md hover:bg-card/80 cursor-pointer ${
                currentFile?.id === file.id ? 'bg-primary/20' : ''
              }`}
              onClick={() => handleFileClick(file)}
            >
              {editingFileId === file.id ? (
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={editFileName}
                    onChange={(e) => setEditFileName(e.target.value)}
                    className="w-full bg-input border border-border rounded-md px-2 py-1 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFileRename(file.id);
                      if (e.key === 'Escape') {
                        setEditingFileId(null);
                        setEditFileName('');
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileRename(file.id);
                    }}
                    className="ml-2 p-1 text-xs rounded-md bg-primary/90 hover:bg-primary text-white"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    {file.type === 'directory' ? (
                      <FiFolder className="mr-2 text-blue-400" />
                    ) : (
                      <FiFile className="mr-2 text-gray-400" />
                    )}
                    <span>{file.name}</span>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFileId(file.id);
                        setEditFileName(file.name);
                      }}
                      className="p-1 hover:bg-primary/20 rounded-md"
                      title="Rename"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      className="p-1 hover:bg-destructive/20 rounded-md text-destructive"
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          
          {files.length === 0 && !isCreatingFile && !isCreatingFolder && (
            <li className="text-center py-4 text-sm text-gray-400">
              No files yet. Create one to get started.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FileExplorer;