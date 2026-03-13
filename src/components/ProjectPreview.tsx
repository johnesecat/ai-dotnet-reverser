// src/components/ProjectPreview.tsx

import React from 'react';
import { FileCode, Folder, ChevronRight, ChevronDown } from 'lucide-react';

interface ProjectPreviewProps {
  projectName: string;
  files: ProjectFile[];
  onFileClick?: (file: ProjectFile) => void;
}

interface ProjectFile {
  path: string;
  content: string;
  type: 'csharp' | 'xaml' | 'xml' | 'json';
}

export function ProjectPreview({ projectName, files, onFileClick }: ProjectPreviewProps) {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set([projectName]));
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);

  const fileTree = buildFileTree(projectName, files);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file: ProjectFile) => {
    setSelectedFile(file.path);
    onFileClick?.(file);
  };

  return (
    <div className="h-full flex">
      {/* File Tree */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900">
        <div className="p-2">
          <FileTreeNode
            node={fileTree}
            level={0}
            expandedFolders={expandedFolders}
            selectedFile={selectedFile}
            onToggleFolder={toggleFolder}
            onFileClick={handleFileClick}
          />
        </div>
      </div>

      {/* File Preview */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
        {selectedFile ? (
          <div>
            <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {selectedFile}
              </h3>
            </div>
            <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {files.find(f => f.path === selectedFile)?.content || ''}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a file to preview
          </div>
        )}
      </div>
    </div>
  );
}

function FileTreeNode({
  node,
  level,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onFileClick
}: {
  node: TreeNode;
  level: number;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  onToggleFolder: (path: string) => void;
  onFileClick: (file: ProjectFile) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const indent = level * 16;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className="w-full flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <Folder className="w-4 h-4 text-yellow-600" />
          <span className="text-gray-900 dark:text-gray-100">{node.name}</span>
        </button>

        {isExpanded && node.children && (
          <div>
            {node.children.map((child, i) => (
              <FileTreeNode
                key={i}
                node={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                selectedFile={selectedFile}
                onToggleFolder={onToggleFolder}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => node.file && onFileClick(node.file)}
      className={`w-full flex items-center gap-2 px-2 py-1 rounded text-sm ${
        selectedFile === node.path
          ? 'bg-blue-100 dark:bg-blue-900'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      style={{ paddingLeft: `${indent + 24}px` }}
    >
      <FileCode className={`w-4 h-4 ${getFileIconColor(node.name)}`} />
      <span className="text-gray-900 dark:text-gray-100">{node.name}</span>
    </button>
  );
}

function buildFileTree(projectName: string, files: ProjectFile[]): TreeNode {
  const root: TreeNode = {
    name: projectName,
    path: projectName,
    type: 'folder',
    children: []
  };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      let node = current.children?.find(c => c.name === part);

      if (!node) {
        node = {
          name: part,
          path,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          file: isFile ? file : undefined
        };
        current.children?.push(node);
      }

      if (!isFile) {
        current = node;
      }
    }
  }

  return root;
}

function getFileIconColor(fileName: string): string {
  if (fileName.endsWith('.cs')) return 'text-green-600';
  if (fileName.endsWith('.xaml')) return 'text-blue-600';
  if (fileName.endsWith('.csproj')) return 'text-purple-600';
  if (fileName.endsWith('.sln')) return 'text-red-600';
  return 'text-gray-600';
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: ProjectFile;
}
