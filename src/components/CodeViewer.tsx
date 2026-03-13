// src/components/CodeViewer.tsx

import React from 'react';
import { Copy, Download } from 'lucide-react';
import { useAssemblyStore } from '../store/assembly-store';

export function CodeViewer() {
  const { selectedMethod } = useAssemblyStore();

  if (!selectedMethod) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Select a method to view its code
      </div>
    );
  }

  const copyCode = () => {
    if (selectedMethod.ilCode) {
      navigator.clipboard.writeText(selectedMethod.ilCode);
    }
  };

  const downloadCode = () => {
    if (selectedMethod.ilCode) {
      const blob = new Blob([selectedMethod.ilCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedMethod.name}.il`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedMethod.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{selectedMethod.signature}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyCode}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={downloadCode}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre">
          {selectedMethod.ilCode || '// IL code not available'}
        </pre>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Complexity:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{selectedMethod.cyclomaticComplexity}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Instructions:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{selectedMethod.instructions?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Obfuscated:</span>
            <span className={`ml-2 font-semibold ${selectedMethod.isObfuscated ? 'text-red-600' : 'text-green-600'}`}>
              {selectedMethod.isObfuscated ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
