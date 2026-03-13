// src/components/FileUploader.tsx

import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { validateFile } from '../utils/file-validator';
import { parseAssembly } from '../parsers/assembly-parser';
import { useAssemblyStore } from '../store/assembly-store';

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setAssembly } = useAssemblyStore();

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate file
      const validation = await validateFile(file);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setIsLoading(false);
        return;
      }

      // Parse assembly
      const assembly = await parseAssembly(file);
      setAssembly(assembly);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse assembly');
    } finally {
      setIsLoading(false);
    }
  }, [setAssembly]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
          ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        {isLoading ? (
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Parsing assembly...</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Upload .NET Assembly
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop a .dll or .exe file, or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports 17 obfuscators: ConfuserEx, Dotfuscator, SmartAssembly, and more
            </p>
          </>
        )}

        <input
          id="file-input"
          type="file"
          accept=".dll,.exe"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
